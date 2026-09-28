import { OptionActionItem } from "@/shared/types/types";
import { useList } from "../components/ListContext";

export function useListMenuActions() {
  const { handleToggleIsRenameOpen } = useList();

  return [
    { id: "rename", action: handleToggleIsRenameOpen },
  ] as OptionActionItem[];
}
