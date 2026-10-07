import { computeFormula } from "@clickup/shared/formula";
import type { Task } from "@/features/task/types";
import type { CustomFilter, CustomFilterOp, ViewSort } from "@/features/viewConfig/types";
import type { CustomField, CustomFieldType, CustomFieldValue } from "./types";

export const FIELD_TYPE_LABEL: Record<CustomFieldType, string> = {
  dropdown: "Dropdown",
  text: "Text",
  number: "Number",
  date: "Date",
  checkbox: "Checkbox",
  people: "People",
  progress: "Progress",
  formula: "Formula",
};

export const FIELD_TYPE_HINT: Record<CustomFieldType, string> = {
  dropdown: "Colored options to pick from",
  text: "Any short text",
  number: "A number, like hours",
  date: "A calendar day",
  checkbox: "Done or not",
  people: "Members of the space",
  progress: "Manual 0-100% bar",
  formula: "Computed from other fields",
};

/** ClickUp's option palette. */
export const OPTION_COLORS = [
  "#1090e0",
  "#0f9d9f",
  "#3db88b",
  "#f8ae00",
  "#e16b16",
  "#e50000",
  "#ee5e99",
  "#b660e0",
  "#7b68ee",
  "#656f7d",
];

export type ResolvedValue = { value: CustomFieldValue | null; error?: string };

/** A task's value for a field; formula fields are computed here (on read). */
export function resolveValue(
  field: CustomField,
  task: Pick<Task, "points" | "customFields">,
  fields: CustomField[],
): ResolvedValue {
  if (field.type === "formula") {
    const result = computeFormula(field, task, fields);
    return result.ok ? { value: result.value } : { value: null, error: result.error };
  }
  return { value: task.customFields?.[field.id] ?? null };
}

export function formatNumber(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** "Oct 20" (this year) or "Oct 20, 2027". */
export function formatDay(iso: string, now = new Date()) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(y !== now.getFullYear() && { year: "numeric" }),
  });
}

/** A local date as "YYYY-MM-DD". */
export const toIsoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** "YYYY-MM-DD" as a local date. */
export function fromIsoDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

// --- Filters --------------------------------------------------------------------------------

type OpOption = { op: CustomFilterOp; label: string };
const presence: OpOption[] = [
  { op: "set", label: "is set" },
  { op: "empty", label: "is empty" },
];
const comparisons: OpOption[] = [
  { op: "gt", label: "is greater than" },
  { op: "lt", label: "is less than" },
  { op: "eq", label: "equals" },
];

export const FILTER_OPS: Record<CustomFieldType, OpOption[]> = {
  dropdown: [{ op: "is", label: "is" }, { op: "is_not", label: "is not" }, ...presence],
  text: [{ op: "contains", label: "contains" }, ...presence],
  number: [...comparisons, ...presence],
  progress: comparisons,
  formula: [...comparisons, ...presence],
  checkbox: [
    { op: "checked", label: "is checked" },
    { op: "unchecked", label: "is not checked" },
  ],
  date: [{ op: "before", label: "is before" }, { op: "after", label: "is after" }, ...presence],
  people: [{ op: "includes", label: "includes" }, ...presence],
};

const VALUELESS_OPS: CustomFilterOp[] = ["set", "empty", "checked", "unchecked"];

/** Whether the filter has what it needs to narrow anything. */
export function filterIsComplete(filter: CustomFilter) {
  if (VALUELESS_OPS.includes(filter.op)) return true;
  if (Array.isArray(filter.value)) return filter.value.length > 0;
  return filter.value !== undefined && String(filter.value).trim() !== "";
}

export function matchesCustomFilter(task: Task, filter: CustomFilter, fields: CustomField[]) {
  const field = fields.find((f) => f.id === filter.fieldId);
  // Filters on deleted fields, or still missing a value, don't narrow the view.
  if (!field || !filterIsComplete(filter)) return true;
  const { value } = resolveValue(field, task, fields);
  const isEmpty = value === null || (Array.isArray(value) && value.length === 0);
  const wanted = filter.value;
  switch (filter.op) {
    case "set":
      return !isEmpty;
    case "empty":
      return isEmpty;
    case "checked":
      return value === true;
    case "unchecked":
      return value !== true;
    case "is":
      return Array.isArray(wanted) && typeof value === "string" && wanted.includes(value);
    case "is_not":
      return !(Array.isArray(wanted) && typeof value === "string" && wanted.includes(value));
    case "contains":
      return typeof value === "string" && value.toLowerCase().includes(String(wanted).trim().toLowerCase());
    case "includes":
      return Array.isArray(wanted) && Array.isArray(value) && value.some((id) => wanted.includes(id));
    case "before":
      return typeof value === "string" && value < String(wanted);
    case "after":
      return typeof value === "string" && value > String(wanted);
    case "gt":
    case "lt":
    case "eq": {
      const n = Number(wanted);
      if (typeof value !== "number" || Number.isNaN(n)) return false;
      return filter.op === "gt" ? value > n : filter.op === "lt" ? value < n : value === n;
    }
  }
}

export function filterByCustomFields(tasks: Task[], filters: CustomFilter[] | undefined, fields: CustomField[] | undefined) {
  if (!filters?.length || !fields) return tasks;
  return tasks.filter((t) => filters.every((f) => matchesCustomFilter(t, f, fields)));
}

// --- Sorting --------------------------------------------------------------------------------

/** A comparable key for a value: a number, a string, or null (empty). */
function sortKey(
  field: CustomField,
  value: CustomFieldValue | null,
  nameOf: (userId: string) => string,
): number | string | null {
  if (value === null) return null;
  switch (field.type) {
    case "dropdown": {
      const index = field.config.options?.findIndex((o) => o.id === value) ?? -1;
      return index === -1 ? null : index;
    }
    case "checkbox":
      return value === true ? 1 : 0;
    case "people":
      return Array.isArray(value) && value.length ? value.map(nameOf).sort().join(", ").toLowerCase() : null;
    case "text":
      return String(value).toLowerCase();
    default:
      return typeof value === "number" || typeof value === "string" ? value : null;
  }
}

/** Sorts by a custom field; empty values always go last. Stable, so the server order breaks ties. */
export function sortByCustomField(
  tasks: Task[],
  sort: ViewSort | null | undefined,
  fields: CustomField[] | undefined,
  nameOf: (userId: string) => string = (id) => id,
) {
  const field = sort && fields?.find((f) => f.id === sort.fieldId);
  if (!sort || !field || !fields) return tasks;
  const dir = sort.dir === "asc" ? 1 : -1;
  const keyed = tasks.map((task, index) => ({
    task,
    index,
    key: sortKey(field, resolveValue(field, task, fields).value, nameOf),
  }));
  keyed.sort((a, b) => {
    if (a.key === null || b.key === null)
      return a.key === b.key ? a.index - b.index : a.key === null ? 1 : -1;
    const cmp =
      typeof a.key === "number" && typeof b.key === "number"
        ? a.key - b.key
        : String(a.key).localeCompare(String(b.key));
    return cmp === 0 ? a.index - b.index : cmp * dir;
  });
  return keyed.map((k) => k.task);
}
