import { create } from "zustand";
import { SortOrder } from "../types";

interface UseTaskSortsStore {
  tableSorts: NewSorts;
  boardSorts: NewSorts;
  listSorts: NewSorts;

  setTableSorts: (newSorts: NewSorts) => void;
  setBoardSorts: (newSorts: NewSorts) => void;
  setListSorts: (newSorts: NewSorts) => void;
}

export interface NewSorts {
  status: SortOrder;
  priority: SortOrder;
  dueDate: SortOrder;
  createdAt: SortOrder;
}

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
