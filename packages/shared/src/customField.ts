import { z } from "zod";
import { idSchema } from "./common.js";

export * from "./formula.js";

/**
 * Per-list custom fields (ClickUp's signature feature). A field has a type and a type-specific
 * `config`; a task's value for it is stored as JSON (one row per task and field):
 *
 * - text: string · number: number · progress: integer 0-100 · checkbox: true
 * - dropdown: the chosen option id · date: "YYYY-MM-DD" (a calendar day) · people: user ids
 * - formula: never stored, computed on read from `config.expression` (see `evaluateFormula`).
 */
export const CUSTOM_FIELD_TYPES = [
  "text",
  "number",
  "dropdown",
  "date",
  "checkbox",
  "people",
  "progress",
  "formula",
] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];
export const customFieldTypeSchema = z.enum(CUSTOM_FIELD_TYPES);

export const customFieldNameSchema = z.string().trim().min(1).max(40);
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const dropdownOptionSchema = z.object({
  /** Missing on new options; the API assigns one. */
  id: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(40),
  color: hexColorSchema,
});

export const customFieldConfigSchema = z.object({
  /** Dropdown options, in order. */
  options: z.array(dropdownOptionSchema).max(30).optional(),
  /** Formula expression, e.g. `points * 2` or `{Estimate (h)} - {Actual (h)}`. */
  expression: z.string().trim().max(500).optional(),
});

export const createCustomFieldSchema = z.object({
  name: customFieldNameSchema,
  type: customFieldTypeSchema,
  config: customFieldConfigSchema.default({}),
});

export const updateCustomFieldSchema = z
  .object({
    name: customFieldNameSchema.optional(),
    config: customFieldConfigSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

/** `null` clears the task's value. */
export const setCustomFieldValueSchema = z.object({ value: z.unknown().nullable() });

export const customFieldValueParamsSchema = z.object({ id: idSchema, fieldId: idSchema });

export const ISO_DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const isoDaySchema = z
  .string()
  .regex(ISO_DAY_REGEX)
  .refine((s) => !Number.isNaN(Date.parse(`${s}T12:00:00Z`)), "Invalid date");

export type DropdownOption = { id: string; name: string; color: string };
export type CustomFieldConfig = { options?: DropdownOption[]; expression?: string };
export type CustomFieldValue = string | number | boolean | string[];

/** A field as the API returns it. */
export interface CustomField {
  id: string;
  listId: string;
  name: string;
  type: CustomFieldType;
  order: number;
  config: CustomFieldConfig;
}

/**
 * Validates a value for a field. Returns the value to store, `null` for "clear" (empty text,
 * unchecked box, no people), or an error message.
 */
export function parseCustomFieldValue(
  field: Pick<CustomField, "type" | "config">,
  value: unknown,
): { ok: true; value: CustomFieldValue | null } | { ok: false; error: string } {
  if (value === null || value === undefined) return { ok: true, value: null };
  const fail = (error: string) => ({ ok: false as const, error });
  switch (field.type) {
    case "text": {
      if (typeof value !== "string") return fail("Expected text");
      const text = value.trim();
      if (text.length > 2000) return fail("Text is too long");
      return { ok: true, value: text || null };
    }
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) >= 1e12) return fail("Expected a number");
      return { ok: true, value };
    case "progress":
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100)
        return fail("Progress must be between 0 and 100");
      return { ok: true, value: Math.round(value) };
    case "checkbox":
      if (typeof value !== "boolean") return fail("Expected true or false");
      return { ok: true, value: value || null };
    case "date":
      return isoDaySchema.safeParse(value).success ? { ok: true, value: value as string } : fail("Expected a YYYY-MM-DD date");
    case "dropdown":
      if (typeof value !== "string" || !(field.config.options ?? []).some((o) => o.id === value))
        return fail("Unknown option");
      return { ok: true, value };
    case "people": {
      const parsed = z.array(idSchema).max(20).safeParse(value);
      if (!parsed.success) return fail("Expected a list of user ids");
      const ids = [...new Set(parsed.data)];
      return { ok: true, value: ids.length ? ids : null };
    }
    case "formula":
      return fail("Formula fields are computed and cannot be set");
  }
}

export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;
export type SetCustomFieldValueInput = z.infer<typeof setCustomFieldValueSchema>;
