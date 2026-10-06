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

interface ViewFilters {
  assignees: string[];
  statuses: string[];
  priorities: Task["priority"][];
  tags: string[];
  due: DueFilter | null;
}

/** What a saved view stores (mirrors `savedViewConfigSchema` in @clickup/shared). */
interface ViewConfig {
  filters: ViewFilters;
  groupBy: GroupBy;
  /** Missing on views saved before swimlanes existed. */
  swimlanes?: Swimlanes;
}

interface SavedView {
  id: string;
  listId: string;
  name: string;
  config: ViewConfig;
  isDefault: boolean;
}

export type { DueKind, GroupBy, Swimlanes, DueFilter, ViewFilters, ViewConfig, SavedView };
