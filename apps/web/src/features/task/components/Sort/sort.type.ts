import { SORT_FIELDS } from "./sort.consts";

type SortField = (typeof SORT_FIELDS)[number];
type SortOrder = "asc" | "desc" | "";
type UsedFor = "table" | "board" | "list";

export type { SortField, SortOrder, UsedFor };
