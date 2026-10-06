import { create } from "zustand";
import type { TemplateTarget } from "./types";

/**
 * The template picker is mounted once per list page (next to the task panel) and opened from any
 * add-task form, so closing that inline form does not unmount the picker.
 */
interface TemplatePickerStore {
  target: TemplateTarget | null;
  openPicker: (target: TemplateTarget) => void;
  closePicker: () => void;
}

export const useTemplatePicker = create<TemplatePickerStore>((set) => ({
  target: null,
  openPicker: (target) => set({ target }),
  closePicker: () => set({ target: null }),
}));
