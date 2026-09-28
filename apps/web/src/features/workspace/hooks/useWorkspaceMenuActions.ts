import { useRename } from "../contexts/RenameProvider";
import { useOpenAvatarPicker } from "../contexts/OpenAvatarProvider";
import { OptionActionItem } from "@/shared/types/types";

export function useWorkspaceMenuActions() {
  const { handleToggleIsRenameOpen } = useRename();
  const { handleToggleAvatarPicker } = useOpenAvatarPicker();

  return [
    { id: "rename", action: handleToggleIsRenameOpen },
    { id: "avatar", action: handleToggleAvatarPicker },
  ] as OptionActionItem[];
}
