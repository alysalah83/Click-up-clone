/** Mirrors `CUSTOM_FIELD_TYPES` / `CustomField` in @clickup/shared. */
export const CUSTOM_FIELD_TYPES = ["dropdown", "text", "number", "date", "checkbox", "people", "progress", "formula"] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export interface DropdownOption {
  id: string;
  name: string;
  color: string;
}

export interface CustomFieldConfig {
  options?: DropdownOption[];
  expression?: string;
}

export interface CustomField {
  id: string;
  listId: string;
  name: string;
  type: CustomFieldType;
  order: number;
  config: CustomFieldConfig;
}

/** A stored value: text, number/progress, dropdown option id, "YYYY-MM-DD", true, or user ids. */
export type CustomFieldValue = string | number | boolean | string[];

/** What the add/edit field form sends (new dropdown options have no id yet). */
export interface CustomFieldDraft {
  name: string;
  type: CustomFieldType;
  config: { options?: { id?: string; name: string; color: string }[]; expression?: string };
}
