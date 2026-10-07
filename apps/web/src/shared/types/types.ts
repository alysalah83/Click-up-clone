import { IconsMap } from "../icons/icons.type";

type UiForAction = "modal" | "menu";
type OptionId = "rename" | "delete" | "avatar" | "import";

type OptionUiItem = {
  id: OptionId;
  icon: IconsMap;
  label: string;
  color: string | null;
  display: {
    uiForAction: UiForAction;
    ActionComponent: React.ComponentType;
    /** Where a modal sits (default "withTopMargin"); tall content uses "center". */
    contentYPosition?: "withTopMargin" | "center";
  } | null;
};

type OptionActionItem = { id: OptionId; action: () => void };

type OptionItem = OptionUiItem & { action: OptionActionItem["action"] | null };

export type { UiForAction, OptionItem, OptionUiItem, OptionActionItem };
