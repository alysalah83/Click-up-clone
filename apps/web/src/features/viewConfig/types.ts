import type { Task } from "@/features/task/types";

type DueKind = "overdue" | "today" | "week" | "none" | "custom";
type GroupBy = "status" | "assignee" | "priority" | "tag";
/** Board swimlanes (ClickUp "Subgroup"). */
type Swimlanes = "none" | "assignee" | "priority";

interface DueFilter {
  kind: DueKind;
  /** ISO dates (YYYY-MM-DD), used by `custom`. */
  from?: string;
  to?: string;
}

type CustomFilterOp =
  | "is"
  | "is_not"
  | "gt"
  | "lt"
  | "eq"
  | "checked"
  | "unchecked"
  | "before"
  | "after"
  | "includes"
  | "contains"
  | "set"
  | "empty";

/** A filter on a custom field (mirrors `customFilterSchema` in @clickup/shared). */
interface CustomFilter {
  fieldId: string;
  op: CustomFilterOp;
  /** Option/user ids (is, is not, includes), a number, a "YYYY-MM-DD" day or text. */
  value?: string | number | string[];
}

/** Client-side sort by a custom field (built-in sorts live in the URL). */
interface ViewSort {
  fieldId: string;
  dir: "asc" | "desc";
}

interface ViewFilters {
  assignees: string[];
  statuses: string[];
  priorities: Task["priority"][];
  tags: string[];
  due: DueFilter | null;
  /** Missing on views saved before custom fields existed. */
  custom: CustomFilter[];
}

/** What a saved view stores (mirrors `savedViewConfigSchema` in @clickup/shared). */
interface ViewConfig {
  filters: ViewFilters;
  groupBy: GroupBy;
  /** Missing on views saved before swimlanes existed. */
  swimlanes?: Swimlanes;
  /** Sort by a custom field (missing on older views). */
  sort?: ViewSort | null;
}

interface SavedView {
  id: string;
  listId: string;
  name: string;
  config: ViewConfig;
  isDefault: boolean;
}

export type { CustomFilter, CustomFilterOp, ViewSort, DueKind, GroupBy, Swimlanes, DueFilter, ViewFilters, ViewConfig, SavedView };
