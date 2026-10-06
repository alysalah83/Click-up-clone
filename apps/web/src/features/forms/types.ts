import type { Task } from "@/features/task/types";

/** Mirrors FORM_FIELD_TYPES / FORM_FIELD_TARGETS in @clickup/shared (form.ts). */
export type FormFieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "dropdown"
  | "number"
  | "date"
  | "priority"
  | "checkbox";
export type FormFieldTarget = "name" | "description" | "priority" | "due_date";

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  mapTo: FormFieldTarget;
};

/** Mirrors the form DTO of the API (`form.service.ts`). */
export type Form = {
  id: string;
  listId: string;
  title: string;
  description: string;
  slug: string;
  isActive: boolean;
  statusId: string | null;
  priority: Task["priority"];
  assigneeId: string | null;
  tagIds: string[];
  fields: FormField[];
  submissionCount: number;
  lastSubmittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string | null; email: string | null };
};

/** The editable part of a form (what the builder autosaves). */
export type FormDraft = Pick<
  Form,
  "title" | "description" | "isActive" | "statusId" | "priority" | "assigneeId" | "tagIds" | "fields"
>;

export type PublicFormField = Omit<FormField, "mapTo">;

/** GET /public/forms/:slug: no list, owner or mapping data. */
export type PublicForm = {
  slug: string;
  title: string;
  description: string;
  fields: PublicFormField[];
};

export type FormAnswers = Record<string, string | boolean>;
