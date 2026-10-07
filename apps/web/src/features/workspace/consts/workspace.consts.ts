import { OptionUiItem } from "@/shared/types/types";
import DeleteWorkspaceConfirm from "../components/WorkspaceDeleteConfirm";
import SpaceImportModalBody from "@/features/import/components/SpaceImportModalBody";

export const ICONS_SIZE = 4;

export const OPTIONS_UI_MENU = [
  {
    id: "avatar",
    icon: "water",
    label: "Icon & Color",
    color: null,
  },
  {
    id: "rename",
    icon: "pen",
    label: "Rename",
    color: null,
    display: null,
  },
  {
    id: "import",
    icon: "upload",
    label: "Import (CSV / Trello)",
    color: null,
    display: {
      uiForAction: "modal",
      ActionComponent: SpaceImportModalBody,
      contentYPosition: "center",
    },
  },
  {
    id: "delete",
    icon: "trash",
    label: "Delete",
    color: "text-red-400/80",
    display: {
      uiForAction: "modal",
      ActionComponent: DeleteWorkspaceConfirm,
    },
  },
] as OptionUiItem[];
