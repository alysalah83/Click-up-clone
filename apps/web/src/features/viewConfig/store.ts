import { create } from "zustand";
import { DEFAULT_CONFIG, EMPTY_FILTERS } from "./lib/applyViewConfig";
import type { GroupBy, Swimlanes, ViewConfig, ViewFilters } from "./types";

interface ViewConfigStore {
  /** List whose default view was already applied; the state below belongs to it. */
  appliedListId: string | null;
  activeViewId: string | null;
  filters: ViewFilters;
  groupBy: GroupBy;
  swimlanes: Swimlanes;
  setFilters: (patch: Partial<ViewFilters>) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setSwimlanes: (swimlanes: Swimlanes) => void;
  clearFilters: () => void;
  /** Loads a config (a saved view or the empty one) and remembers which view it came from. */
  load: (config: ViewConfig, viewId: string | null, listId?: string) => void;
}

/**
 * The filters/groupBy/swimlanes of the List, Board and Table views. Kept in memory so it survives switching
 * between those views; saved views are what persists it (per list, in the API).
 */
export const useViewConfigStore = create<ViewConfigStore>((set) => ({
  appliedListId: null,
  activeViewId: null,
  filters: EMPTY_FILTERS,
  groupBy: DEFAULT_CONFIG.groupBy,
  swimlanes: "none",
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch }, activeViewId: null })),
  setGroupBy: (groupBy) => set({ groupBy, activeViewId: null }),
  setSwimlanes: (swimlanes) => set({ swimlanes, activeViewId: null }),
  clearFilters: () => set({ filters: EMPTY_FILTERS, activeViewId: null }),
  load: (config, viewId, listId) =>
    set((s) => ({
      filters: { ...EMPTY_FILTERS, ...config.filters },
      groupBy: config.groupBy ?? "status",
      swimlanes: config.swimlanes ?? "none",
      activeViewId: viewId,
      appliedListId: listId ?? s.appliedListId,
    })),
}));
