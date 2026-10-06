import type { FormAnswers, FormDraft, FormField, FormFieldTarget, FormFieldType, PublicFormField } from "./types";

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  email: "Email",
  dropdown: "Dropdown",
  number: "Number",
  date: "Date",
  priority: "Priority",
  checkbox: "Checkbox",
};
export const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FormFieldType[];

export const TARGET_LABELS: Record<FormFieldTarget, string> = {
  name: "Task name",
  description: "Task description",
  priority: "Priority",
  due_date: "Due date",
};

/** Mirrors FORM_TARGET_TYPES in @clickup/shared. */
const TARGET_TYPES: Record<FormFieldTarget, readonly FormFieldType[]> = {
  name: ["short_text", "long_text", "email", "dropdown"],
  description: FIELD_TYPES,
  priority: ["priority", "dropdown"],
  due_date: ["date"],
};

export const FORM_PRIORITIES = ["urgent", "high", "normal", "low"] as const;
export const MAX_FORM_FIELDS = 30;
const SHORT_MAX = 255;
const LONG_MAX = 5000;

/** Task properties a field of this type can fill. */
export const targetsFor = (type: FormFieldType) =>
  (Object.keys(TARGET_TYPES) as FormFieldTarget[]).filter((t) => TARGET_TYPES[t].includes(type));

export const isFieldRequired = (field: Pick<FormField, "required" | "mapTo">) => field.required || field.mapTo === "name";

let counter = 0;
export const newFieldId = () => `f${Date.now().toString(36)}${(counter++).toString(36)}`.slice(0, 40);

export function makeField(type: FormFieldType): FormField {
  return {
    id: newFieldId(),
    type,
    label: FIELD_TYPE_LABELS[type],
    placeholder: "",
    required: false,
    options: type === "dropdown" ? ["Option 1", "Option 2"] : [],
    mapTo: "description",
  };
}

/** Changes a field's type; a mapping the new type cannot fill falls back to the description. */
export function changeFieldType(fields: FormField[], id: string, type: FormFieldType): FormField[] {
  return fields.map((f) => {
    if (f.id !== id) return f;
    const mapTo = TARGET_TYPES[f.mapTo].includes(type) ? f.mapTo : f.mapTo === "name" ? f.mapTo : "description";
    const options = type === "dropdown" && f.options.length === 0 ? ["Option 1", "Option 2"] : f.options;
    // The name field must stay a text-like type.
    if (f.mapTo === "name" && !TARGET_TYPES.name.includes(type)) return f;
    return { ...f, type, mapTo, options };
  });
}

/**
 * Maps a field to a task property. Name, priority and due date take one field each: the field
 * that held the property before goes back to the description.
 */
export function mapField(fields: FormField[], id: string, target: FormFieldTarget): FormField[] {
  const current = fields.find((f) => f.id === id);
  if (!current || !TARGET_TYPES[target].includes(current.type)) return fields;
  // The name field can only be moved by mapping another field to the name.
  if (current.mapTo === "name" && target !== "name") return fields;
  return fields.map((f) => {
    if (f.id === id) return { ...f, mapTo: target };
    if (target !== "description" && f.mapTo === target) return { ...f, mapTo: "description" };
    return f;
  });
}

export function moveField(fields: FormField[], id: string, delta: -1 | 1): FormField[] {
  const from = fields.findIndex((f) => f.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= fields.length) return fields;
  const next = [...fields];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/** The task-name field cannot be removed. */
export const removeField = (fields: FormField[], id: string) =>
  fields.filter((f) => f.id !== id || f.mapTo === "name");

/** Problems that would make the API reject the fields (shown in the builder, block autosave). */
export function draftProblems(draft: Pick<FormDraft, "title" | "fields">): Record<string, string> {
  const problems: Record<string, string> = {};
  if (!draft.title.trim()) problems.title = "Give the form a title";
  for (const f of draft.fields) {
    if (!f.label.trim()) problems[f.id] = "Add a label";
    else if (f.type === "dropdown" && !f.options.some((o) => o.trim())) problems[f.id] = "Add at least one option";
    else if (f.type === "dropdown" && f.options.some((o) => !o.trim())) problems[f.id] = "Options cannot be empty";
  }
  return problems;
}

/** What the API accepts: trimmed labels and options. */
export function cleanDraft(draft: FormDraft): FormDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    fields: draft.fields.map((f) => ({
      ...f,
      label: f.label.trim(),
      placeholder: f.placeholder.trim(),
      options: f.options.map((o) => o.trim()),
    })),
  };
}

export const toPublicFields = (fields: FormField[]): PublicFormField[] =>
  fields.map((f) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    placeholder: f.placeholder,
    required: isFieldRequired(f),
    options: f.options,
  }));

export const publicFormPath = (slug: string) => `/forms/${slug}`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Client-side check of the answers (mirrors `validateFormAnswers` in @clickup/shared). */
export function validateAnswers(fields: PublicFormField[], answers: FormAnswers): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const raw = answers[field.id];
    const text = typeof raw === "string" ? raw.trim() : "";
    const empty = field.type === "checkbox" ? raw !== true : text === "";
    if (empty) {
      if (field.required) errors[field.id] = "This field is required";
      continue;
    }
    if (field.type === "short_text" && text.length > SHORT_MAX) errors[field.id] = `Keep it under ${SHORT_MAX} characters`;
    if (field.type === "long_text" && text.length > LONG_MAX) errors[field.id] = `Keep it under ${LONG_MAX} characters`;
    if (field.type === "email" && !EMAIL_RE.test(text)) errors[field.id] = "Enter a valid email address";
    if (field.type === "dropdown" && !field.options.includes(text)) errors[field.id] = "Pick one of the options";
    if (field.type === "priority" && !(FORM_PRIORITIES as readonly string[]).includes(text)) errors[field.id] = "Pick a priority";
    if (field.type === "number" && !Number.isFinite(Number(text))) errors[field.id] = "Enter a number";
    if (field.type === "date" && !isValidDay(text)) errors[field.id] = "Enter a valid date";
  }
  return errors;
}

/** The request body: numbers as numbers, empty answers left out. */
export function toSubmission(fields: PublicFormField[], answers: FormAnswers) {
  const out: Record<string, string | number | boolean> = {};
  for (const field of fields) {
    const raw = answers[field.id];
    if (raw === undefined || raw === "") continue;
    out[field.id] = field.type === "number" && typeof raw === "string" ? Number(raw) : raw;
  }
  return out;
}

export function lastSubmittedLabel(iso: string | null, now = new Date()) {
  if (!iso) return "No responses yet";
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Last response just now";
  if (minutes < 60) return `Last response ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last response ${hours} h ago`;
  const days = Math.round(hours / 24);
  return `Last response ${days} day${days === 1 ? "" : "s"} ago`;
}
