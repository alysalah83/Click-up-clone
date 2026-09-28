import { OptionUiItem } from "@/shared/types/types";
import DeleteListConfirm from "./components/ListDeleteConfirm";

export const OPTIONS_UI_MENU = [
  {
    id: "rename",
    icon: "pen",
    label: "Rename",
    color: null,
    display: null,
  },
  {
    id: "delete",
    icon: "trash",
    label: "Delete",
    color: "text-red-400/80",
    display: {
      uiForAction: "modal",
      ActionComponent: DeleteListConfirm,
    },
  },
] as OptionUiItem[];

export const ICONS_SIZE = 3.5;
