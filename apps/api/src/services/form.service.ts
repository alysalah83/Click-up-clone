import { randomBytes } from "node:crypto";
import {
  DEFAULT_FORM_FIELDS,
  formFieldsSchema,
  formSubmissionTask,
  isFieldRequired,
  validateFormAnswers,
  type CreateFormInput,
  type FormField,
  type SubmitFormInput,
  type UpdateFormInput,
} from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess, listInMyWorkspaces } from "./access.service.js";
import { createTask, setAssignees } from "./task.service.js";

/** 16 random bytes as base64url: a 22-character unguessable public link token. */
export const newFormSlug = () => randomBytes(16).toString("base64url");

const formSelect = {
  id: true,
  listId: true,
  title: true,
  description: true,
  slug: true,
  isActive: true,
  statusId: true,
  priority: true,
  assigneeId: true,
  tagIds: true,
  fields: true,
  submissionCount: true,
  lastSubmittedAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.FormSelect;

type FormRow = Prisma.FormGetPayload<{ select: typeof formSelect }>;

/** Stored fields are re-validated on read; a broken row falls back to the default fields. */
function parseFields(fields: unknown): FormField[] {
  const parsed = formFieldsSchema.safeParse(fields);
  return parsed.success ? parsed.data : DEFAULT_FORM_FIELDS;
}

const toFormDto = (row: FormRow) => ({ ...row, fields: parseFields(row.fields) });

export async function listForms(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  const rows = await prisma.form.findMany({
    where: { listId },
    select: formSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return rows.map(toFormDto);
}

export async function createForm(userId: string, listId: string, input: CreateFormInput) {
  await assertCanAccess(userId, { listId }, "member");
  const list = await prisma.list.findUniqueOrThrow({ where: { id: listId }, select: { name: true } });
  const created = await prisma.form.create({
    data: {
      listId,
      createdById: userId,
      title: input.title ?? `${list.name} form`,
      slug: newFormSlug(),
      fields: DEFAULT_FORM_FIELDS as Prisma.InputJsonArray,
    },
    select: formSelect,
  });
  return toFormDto(created);
}

/** A form the user can reach; a non-member gets the same 404 as a missing form. */
async function accessibleForm(userId: string, id: string) {
  const form = await prisma.form.findFirst({
    where: { id, list: listInMyWorkspaces(userId) },
    select: { id: true, listId: true, list: { select: { workspaceId: true } } },
  });
  if (!form) throw new NotFoundError("Form not found");
  return form;
}

const invalid = (field: string, message: string) =>
  new ValidationError(message, { formErrors: [], fieldErrors: { [field]: [message] } });

export async function updateForm(userId: string, id: string, input: UpdateFormInput) {
  const form = await accessibleForm(userId, id);
  const { workspaceId } = await assertCanAccess(userId, { listId: form.listId }, "member");

  if (input.statusId) {
    const count = await prisma.status.count({ where: { id: input.statusId, listId: form.listId } });
    if (count === 0) throw invalid("statusId", "Status does not belong to this list");
  }
  if (input.assigneeId) {
    const member = await prisma.workspaceMember.count({ where: { workspaceId, userId: input.assigneeId } });
    if (member === 0) throw invalid("assigneeId", "The assignee must be a member of the space");
  }
  if (input.tagIds?.length) {
    const ids = [...new Set(input.tagIds)];
    const count = await prisma.tag.count({ where: { id: { in: ids }, workspaceId } });
    if (count !== ids.length) throw invalid("tagIds", "Tags must belong to this space");
    input = { ...input, tagIds: ids };
  }

  const { fields, ...rest } = input;
  const updated = await prisma.form.update({
    where: { id },
    data: { ...rest, ...(fields && { fields: fields as Prisma.InputJsonArray }) },
    select: formSelect,
  });
  return toFormDto(updated);
}

export async function deleteForm(userId: string, id: string) {
  const form = await accessibleForm(userId, id);
  await assertCanAccess(userId, { listId: form.listId }, "member");
  await prisma.form.delete({ where: { id } });
  return { id };
}

// --- Public ---------------------------------------------------------------------------------

async function activeForm(slug: string) {
  const form = await prisma.form.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      isActive: true,
      listId: true,
      statusId: true,
      priority: true,
      assigneeId: true,
      tagIds: true,
      fields: true,
      createdById: true,
      list: { select: { workspaceId: true, workspace: { select: { userId: true } } } },
    },
  });
  // Inactive and missing look the same to the public.
  if (!form || !form.isActive) throw new NotFoundError("This form does not exist or is no longer accepting responses");
  return { ...form, fields: parseFields(form.fields) };
}

/** What the public page needs: title, description and the fields (no list, owner or mapping data). */
export async function getPublicForm(slug: string) {
  const form = await activeForm(slug);
  return {
    slug,
    title: form.title,
    description: form.description,
    fields: form.fields.map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      placeholder: f.placeholder,
      required: isFieldRequired(f),
      options: f.options,
    })),
  };
}

/**
 * Creates a task in the form's list through the normal task creation path (activity, automations),
 * as the form owner, or the space owner when the owner left the space. The honeypot answer is
 * accepted silently without creating anything.
 */
export async function submitForm(slug: string, input: SubmitFormInput, now = new Date()) {
  const form = await activeForm(slug);
  if (input.website?.trim()) return { ok: true };

  const { values, errors } = validateFormAnswers(form.fields, input.answers);
  if (Object.keys(errors).length > 0)
    throw new ValidationError("Some answers are not valid", {
      formErrors: [],
      fieldErrors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])),
    });

  const { workspaceId } = form.list;
  const ownerIsMember = await prisma.workspaceMember.count({ where: { workspaceId, userId: form.createdById } });
  const actorId = ownerIsMember ? form.createdById : form.list.workspace.userId;
  if (!actorId) throw new NotFoundError("This form does not exist or is no longer accepting responses");

  const status =
    (form.statusId && (await prisma.status.findFirst({ where: { id: form.statusId, listId: form.listId }, select: { id: true } }))) ||
    (await prisma.status.findFirstOrThrow({
      where: { listId: form.listId },
      orderBy: [{ type: "asc" }, { order: "asc" }],
      select: { id: true },
    }));

  const mapped = formSubmissionTask(form, values);
  const task = await createTask(
    actorId,
    {
      listId: form.listId,
      statusId: status.id,
      name: mapped.name,
      priority: mapped.priority ?? form.priority,
      startDate: mapped.endDate ?? null,
      endDate: mapped.endDate ?? null,
    },
    {
      description: mapped.description as Prisma.InputJsonObject,
      activities: [{ type: "submitted_via_form", data: { name: form.title } }],
    },
  );

  if (form.tagIds.length > 0) {
    const tags = await prisma.tag.findMany({ where: { id: { in: form.tagIds }, workspaceId }, select: { id: true } });
    await prisma.taskTag.createMany({ data: tags.map((t) => ({ taskId: task.id, tagId: t.id })), skipDuplicates: true });
  }
  if (form.assigneeId) {
    const member = await prisma.workspaceMember.count({ where: { workspaceId, userId: form.assigneeId } });
    if (member > 0) await setAssignees(actorId, task.id, { userIds: [form.assigneeId] });
  }

  await prisma.form.update({
    where: { id: form.id },
    data: { submissionCount: { increment: 1 }, lastSubmittedAt: now },
  });
  return { ok: true };
}
