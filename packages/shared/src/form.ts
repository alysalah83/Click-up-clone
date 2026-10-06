import { z } from "zod";
import { idSchema, prioritySchema, type Priority } from "./common.js";
import type { RichTextDoc } from "./taskDetail.js";

/**
 * Forms (ClickUp Form view): a public form on a list whose submissions create tasks there.
 * `fields` is an ordered JSON array validated by `formFieldsSchema`. Exactly one field becomes
 * the task name; the others go to the description ("Label: value" list) or to a task property
 * (priority, due date). Answers are checked by `validateFormAnswers` on the client and the server.
 */

export const FORM_FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "dropdown",
  "number",
  "date",
  "priority",
  "checkbox",
] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const FORM_FIELD_TARGETS = ["name", "description", "priority", "due_date"] as const;
export type FormFieldTarget = (typeof FORM_FIELD_TARGETS)[number];

/** Which field types each task property accepts (the description takes any type). */
export const FORM_TARGET_TYPES: Record<FormFieldTarget, readonly FormFieldType[]> = {
  name: ["short_text", "long_text", "email", "dropdown"],
  description: FORM_FIELD_TYPES,
  priority: ["priority", "dropdown"],
  due_date: ["date"],
};

export const MAX_FORM_FIELDS = 30;
export const MAX_FORM_OPTIONS = 30;
export const FORM_SHORT_TEXT_MAX = 255;
export const FORM_LONG_TEXT_MAX = 5000;
/** The answer priority field offers these (no "none"). */
export const FORM_PRIORITIES = ["urgent", "high", "normal", "low"] as const;

export const formFieldIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, "Invalid field id");
const formOptionSchema = z.string().trim().min(1).max(100);

export const formFieldSchema = z.object({
  id: formFieldIdSchema,
  type: z.enum(FORM_FIELD_TYPES),
  label: z.string().trim().min(1).max(100),
  placeholder: z.string().trim().max(200).default(""),
  required: z.boolean().default(false),
  options: z.array(formOptionSchema).max(MAX_FORM_OPTIONS).default([]),
  mapTo: z.enum(FORM_FIELD_TARGETS).default("description"),
});

/** The field list: one task-name field, at most one priority and one due date field, unique ids. */
export const formFieldsSchema = z
  .array(formFieldSchema)
  .min(1)
  .max(MAX_FORM_FIELDS)
  .superRefine((fields, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    if (new Set(fields.map((f) => f.id)).size !== fields.length) issue("Field ids must be unique");
    const names = fields.filter((f) => f.mapTo === "name").length;
    if (names !== 1) issue("Exactly one field must be mapped to the task name");
    for (const target of ["priority", "due_date"] as const)
      if (fields.filter((f) => f.mapTo === target).length > 1) issue(`Only one field can be mapped to ${target}`);
    for (const field of fields) {
      if (!FORM_TARGET_TYPES[field.mapTo].includes(field.type))
        issue(`"${field.label}" (${field.type}) cannot be mapped to ${field.mapTo}`);
      if (field.type === "dropdown" && field.options.length === 0) issue(`"${field.label}" needs at least one option`);
    }
  });

const formTitleSchema = z.string().trim().min(1).max(120);
const formDescriptionSchema = z.string().trim().max(1000);

export const createFormSchema = z.object({ title: formTitleSchema.optional() });

export const updateFormSchema = z
  .object({
    title: formTitleSchema.optional(),
    description: formDescriptionSchema.optional(),
    isActive: z.boolean().optional(),
    /** Status of the created tasks; null = the list's open status. */
    statusId: idSchema.nullable().optional(),
    /** Priority of the created tasks when no field sets one. */
    priority: prioritySchema.optional(),
    assigneeId: idSchema.nullable().optional(),
    tagIds: z.array(idSchema).max(10).optional(),
    fields: formFieldsSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const formSlugSchema = z.string().regex(/^[A-Za-z0-9_-]{16,40}$/, "Invalid form link");
export const formSlugParamsSchema = z.object({ slug: formSlugSchema });

const answerValueSchema = z.union([z.string().max(FORM_LONG_TEXT_MAX), z.number(), z.boolean(), z.null()]);

/** POST /public/forms/:slug/submissions. `website` is a hidden honeypot that humans leave empty. */
export const submitFormSchema = z.object({
  answers: z
    .record(formFieldIdSchema, answerValueSchema)
    .refine((a) => Object.keys(a).length <= MAX_FORM_FIELDS, "Too many answers"),
  website: z.string().max(500).optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;
export type FormFieldInput = z.input<typeof formFieldSchema>;
export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type SubmitFormInput = z.infer<typeof submitFormSchema>;
export type FormAnswerValue = z.infer<typeof answerValueSchema>;

/** The fields of a new form: a task name and a description. */
export const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: "name", type: "short_text", label: "Task name", placeholder: "What is this about?", required: true, options: [], mapTo: "name" },
  { id: "details", type: "long_text", label: "Details", placeholder: "Tell us more", required: false, options: [], mapTo: "description" },
];

// --- Answers --------------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A field is required when marked so, and the task-name field always is. */
export const isFieldRequired = (field: Pick<FormField, "required" | "mapTo">) => field.required || field.mapTo === "name";

function isValidDay(value: string) {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Checks answers against the field definitions. Returns the normalized values (trimmed text,
 * numbers, booleans; null when empty) and an error message per invalid field. Unknown keys are ignored.
 */
export function validateFormAnswers(
  fields: FormField[],
  answers: Record<string, FormAnswerValue | undefined>,
): { values: Record<string, string | number | boolean | null>; errors: Record<string, string> } {
  const values: Record<string, string | number | boolean | null> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const raw = answers[field.id];
    const text = typeof raw === "string" ? raw.trim() : typeof raw === "number" ? String(raw) : "";
    const empty = field.type === "checkbox" ? raw !== true : text === "";
    if (empty) {
      if (isFieldRequired(field)) errors[field.id] = "This field is required";
      values[field.id] = field.type === "checkbox" ? false : null;
      continue;
    }
    switch (field.type) {
      case "short_text":
      case "long_text": {
        const max = field.type === "short_text" ? FORM_SHORT_TEXT_MAX : FORM_LONG_TEXT_MAX;
        if (text.length > max) errors[field.id] = `Keep it under ${max} characters`;
        values[field.id] = text;
        break;
      }
      case "email":
        if (!EMAIL_RE.test(text) || text.length > FORM_SHORT_TEXT_MAX) errors[field.id] = "Enter a valid email address";
        values[field.id] = text;
        break;
      case "dropdown":
        if (!field.options.includes(text)) errors[field.id] = "Pick one of the options";
        values[field.id] = text;
        break;
      case "priority":
        if (!(FORM_PRIORITIES as readonly string[]).includes(text)) errors[field.id] = "Pick a priority";
        values[field.id] = text;
        break;
      case "number": {
        const n = Number(text);
        if (!Number.isFinite(n)) errors[field.id] = "Enter a number";
        values[field.id] = Number.isFinite(n) ? n : null;
        break;
      }
      case "date":
        if (!isValidDay(text)) errors[field.id] = "Enter a valid date";
        values[field.id] = text;
        break;
      case "checkbox":
        values[field.id] = true;
        break;
    }
  }
  return { values, errors };
}

/** Dropdown answers mapped to priority: "Critical"/"Urgent" -> urgent, "Medium"/"Normal" -> normal... */
export function priorityFromAnswer(value: string): Priority {
  const v = value.trim().toLowerCase();
  if (/(urgent|critical|blocker|p0)/.test(v)) return "urgent";
  if (/(high|major|p1)/.test(v)) return "high";
  if (/(medium|normal|moderate|p2)/.test(v)) return "normal";
  if (/(low|minor|trivial|p3)/.test(v)) return "low";
  return "none";
}

function displayValue(field: FormField, value: string | number | boolean | null) {
  if (field.type === "checkbox") return value === true ? "Yes" : "No";
  if (field.type === "priority" && typeof value === "string") return value.charAt(0).toUpperCase() + value.slice(1);
  return value === null ? "" : String(value);
}

type Node = Record<string, unknown>;
const text = (value: string, bold = false): Node =>
  bold ? { type: "text", text: value, marks: [{ type: "bold" }] } : { type: "text", text: value };
const paragraph = (...content: Node[]): Node => (content.length ? { type: "paragraph", content } : { type: "paragraph" });

/**
 * The task a submission creates: the name field's answer (cut to 128 characters), the priority and
 * due date from mapped fields, and a description that lists every other answered field as
 * "Label: value" (long answers keep their line breaks) under a "Submitted via form" line.
 */
export function formSubmissionTask(
  form: { title: string; fields: FormField[] },
  values: Record<string, string | number | boolean | null>,
): { name: string; priority?: Priority; endDate?: Date; description: RichTextDoc } {
  let name = "";
  let priority: Priority | undefined;
  let endDate: Date | undefined;
  const items: Node[] = [];

  for (const field of form.fields) {
    const value = values[field.id] ?? null;
    if (field.mapTo === "name") {
      name = displayValue(field, value).replace(/\s+/g, " ").trim().slice(0, 128).trim();
      continue;
    }
    if (field.mapTo === "priority" && typeof value === "string" && value) {
      const p = field.type === "priority" ? (value as Priority) : priorityFromAnswer(value);
      if (p !== "none") priority = p;
    }
    if (field.mapTo === "due_date" && typeof value === "string" && value) endDate = new Date(`${value}T12:00:00Z`);

    if (value === null || value === "" || (field.type === "checkbox" && value === false && !field.required)) continue;
    const shown = displayValue(field, value);
    const lines = shown.split(/\r?\n/);
    const content =
      field.type === "long_text" && lines.length > 1
        ? [paragraph(text(`${field.label}:`, true)), ...lines.map((line) => (line.trim() ? paragraph(text(line)) : paragraph()))]
        : [paragraph(text(`${field.label}: `, true), text(shown))];
    items.push({ type: "listItem", content });
  }

  const content: Node[] = [paragraph(text("Submitted via form "), text(form.title, true))];
  if (items.length) content.push({ type: "bulletList", content: items });
  return { name: name || form.title, priority, endDate, description: { type: "doc", content } };
}
