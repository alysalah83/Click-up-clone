import { randomUUID } from "node:crypto";
import {
  customFieldConfigSchema,
  parseCustomFieldValue,
  validateFormula,
  type CreateCustomFieldInput,
  type CustomField,
  type CustomFieldConfig,
  type CustomFieldType,
  type CustomFieldValue,
  type UpdateCustomFieldInput,
} from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess, listInMyWorkspaces } from "./access.service.js";
import { logActivity } from "./activity.service.js";

const fieldSelect = { id: true, listId: true, name: true, type: true, order: true, config: true } as const;
type FieldRow = Prisma.CustomFieldGetPayload<{ select: typeof fieldSelect }>;

/** Stored config is re-validated on read; a broken row reads as an empty config. */
function parseConfig(config: unknown): CustomFieldConfig {
  const parsed = customFieldConfigSchema.safeParse(config);
  if (!parsed.success) return {};
  const { options, expression } = parsed.data;
  return {
    ...(options && { options: options.map((o) => ({ ...o, id: o.id ?? "" })) }),
    ...(expression !== undefined && { expression }),
  };
}

export const toFieldDto = (row: FieldRow): CustomField => ({ ...row, config: parseConfig(row.config) });

const invalid = (field: string, message: string) =>
  new ValidationError(message, { formErrors: [], fieldErrors: { [field]: [message] } });

/** Keeps only the config keys the type uses, gives new dropdown options an id and checks formulas. */
function normalizeConfig(
  type: CustomFieldType,
  config: CreateCustomFieldInput["config"],
  siblings: CustomField[],
): CustomFieldConfig {
  if (type === "dropdown") {
    const options = (config.options ?? []).map((o) => ({ id: o.id ?? randomUUID(), name: o.name, color: o.color }));
    if (new Set(options.map((o) => o.id)).size !== options.length) throw invalid("config", "Duplicate option ids");
    return { options };
  }
  if (type === "formula") {
    const expression = config.expression ?? "";
    const error = validateFormula(expression, siblings);
    if (error) throw invalid("config", error);
    return { expression };
  }
  return {};
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

async function listFields(listId: string) {
  const rows = await prisma.customField.findMany({
    where: { listId },
    select: fieldSelect,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toFieldDto);
}

export async function listCustomFields(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  return listFields(listId);
}

export async function createCustomField(userId: string, listId: string, input: CreateCustomFieldInput) {
  await assertCanAccess(userId, { listId }, "member");
  const siblings = await listFields(listId);
  if (siblings.some((f) => sameName(f.name, input.name))) throw new ConflictError("A field with this name already exists");
  if (siblings.length >= 30) throw invalid("name", "A list can have up to 30 custom fields");
  const config = normalizeConfig(input.type, input.config, siblings);
  const row = await prisma.customField.create({
    data: {
      listId,
      name: input.name,
      type: input.type,
      order: (siblings.at(-1)?.order ?? -1) + 1,
      config: config as Prisma.InputJsonObject,
    },
    select: fieldSelect,
  });
  return toFieldDto(row);
}

async function accessibleField(userId: string, id: string) {
  const row = await prisma.customField.findFirst({
    where: { id, list: listInMyWorkspaces(userId) },
    select: fieldSelect,
  });
  if (!row) throw new NotFoundError("Custom field not found");
  return toFieldDto(row);
}

/** Escapes a name for a RegExp. */
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function updateCustomField(userId: string, id: string, input: UpdateCustomFieldInput) {
  const field = await accessibleField(userId, id);
  await assertCanAccess(userId, { listId: field.listId }, "member");
  const siblings = (await listFields(field.listId)).filter((f) => f.id !== id);
  const name = input.name ?? field.name;
  if (input.name && siblings.some((f) => sameName(f.name, input.name!)))
    throw new ConflictError("A field with this name already exists");

  const config = input.config ? normalizeConfig(field.type, input.config, siblings) : field.config;
  const writes: Prisma.PrismaPromise<unknown>[] = [
    prisma.customField.update({ where: { id }, data: { name, config: config as Prisma.InputJsonObject } }),
  ];

  // Values pointing at a removed dropdown option are cleared.
  if (field.type === "dropdown" && input.config) {
    const kept = new Set((config.options ?? []).map((o) => o.id));
    const removed = (field.config.options ?? []).filter((o) => !kept.has(o.id)).map((o) => o.id);
    for (const optionId of removed)
      writes.push(prisma.customFieldValue.deleteMany({ where: { fieldId: id, value: { equals: optionId } } }));
  }

  // Formulas of the list follow a renamed field.
  if (input.name && !sameName(input.name, field.name)) {
    const pattern = new RegExp(`\\{\\s*${escapeRe(field.name.trim())}\\s*\\}`, "gi");
    for (const formula of siblings.filter((f) => f.type === "formula" && f.config.expression)) {
      const expression = formula.config.expression!.replace(pattern, `{${name}}`);
      if (expression !== formula.config.expression)
        writes.push(prisma.customField.update({ where: { id: formula.id }, data: { config: { expression } } }));
    }
  }

  await prisma.$transaction(writes);
  return accessibleField(userId, id);
}

export async function deleteCustomField(userId: string, id: string) {
  const field = await accessibleField(userId, id);
  await assertCanAccess(userId, { listId: field.listId }, "member");
  await prisma.customField.delete({ where: { id } });
  return field;
}

/** Human-readable value for the activity feed ("set Severity to High"). */
async function valueLabel(field: CustomField, value: CustomFieldValue | null) {
  if (value === null) return null;
  switch (field.type) {
    case "dropdown":
      return field.config.options?.find((o) => o.id === value)?.name ?? null;
    case "checkbox":
      return "checked";
    case "progress":
      return `${String(value)}%`;
    case "people": {
      const users = await prisma.user.findMany({
        where: { id: { in: value as string[] } },
        select: { name: true, email: true },
      });
      return users.map((u) => u.name ?? u.email ?? "someone").join(", ");
    }
    default:
      return String(value);
  }
}

/** Sets (or, with `null`, clears) a task's value for a field of the task's list. */
export async function setCustomFieldValue(userId: string, taskId: string, fieldId: string, raw: unknown) {
  const { workspaceId } = await assertCanAccess(userId, { taskId });
  const [task, row] = await Promise.all([
    prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: { listId: true } }),
    prisma.customField.findUnique({ where: { id: fieldId }, select: fieldSelect }),
  ]);
  if (!row || row.listId !== task.listId) throw new NotFoundError("Custom field not found");
  const field = toFieldDto(row);

  const parsed = parseCustomFieldValue(field, raw);
  if (!parsed.ok) throw invalid("value", parsed.error);
  const value = parsed.value;

  if (field.type === "people" && Array.isArray(value)) {
    const members = await prisma.workspaceMember.count({ where: { workspaceId, userId: { in: value } } });
    if (members !== value.length) throw invalid("value", "People must be members of the space");
  }

  const key = { taskId_fieldId: { taskId, fieldId } };
  const before = await prisma.customFieldValue.findUnique({ where: key, select: { value: true } });
  const changed = JSON.stringify(before?.value ?? null) !== JSON.stringify(value);

  if (value === null) await prisma.customFieldValue.deleteMany({ where: { taskId, fieldId } });
  else
    await prisma.customFieldValue.upsert({
      where: key,
      create: { taskId, fieldId, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });

  if (changed)
    await logActivity([
      {
        taskId,
        actorId: userId,
        type: "custom_field",
        data: { field: field.name, fieldType: field.type, to: await valueLabel(field, value) },
      },
    ]);
  return { taskId, fieldId, value };
}
