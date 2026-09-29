import { create } from "zustand";
import { SortOrder } from "../types";

/**
 * Remembers each view's last sort so the header tabs can carry it over when
 * switching views (the URL params are what actually drive sorting). The
 * calendar tab doesn't carry sorts, so it has no slot.
 */
interface UseTaskSortsStore {
  tableSorts: NewSorts;
  boardSorts: NewSorts;
  listSorts: NewSorts;

  setTableSorts: (newSorts: NewSorts) => void;
  setBoardSorts: (newSorts: NewSorts) => void;
  setListSorts: (newSorts: NewSorts) => void;
}

// A type alias (not an interface) so it is assignable to Record<string, string>.
export type NewSorts = {
  status: SortOrder;
  priority: SortOrder;
  dueDate: SortOrder;
  createdAt: SortOrder;
};

export const useTaskSortsStore = create<UseTaskSortsStore>((set) => ({
  tableSorts: {
    status: "",
    priority: "",
    dueDate: "",
    createdAt: "",
  },
  boardSorts: {
    status: "",
    priority: "",
    dueDate: "",
    createdAt: "",
  },
  listSorts: { status: "", priority: "", dueDate: "", createdAt: "" },

  setTableSorts: (newSorts) => set({ tableSorts: newSorts }),
  setBoardSorts: (newSorts) => set({ boardSorts: newSorts }),
  setListSorts: (newSorts) => set({ listSorts: newSorts }),
}));
