import { OptionActionItem, OptionItem, OptionUiItem } from "../../types/types";

export const getOptionItems = (
  optionActions: OptionActionItem[],
  optionUis: OptionUiItem[],
): OptionItem[] =>
  optionUis.map((optionUiItem) => {
    const action =
      optionActions.find((item) => item.id === optionUiItem.id)?.action ?? null;
    return { ...optionUiItem, action };
  });
