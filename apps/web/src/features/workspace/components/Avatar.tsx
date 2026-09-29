"use client";

import { memo, startTransition, useOptimistic } from "react";
import { AvatarWithPickerMenu } from "@/shared/ui/AvatarPicker";
import { isAvatarIcon } from "@/shared/ui/AvatarPicker/helper";
import { useWorkspace } from "../contexts/WorkspaceProvider";
import { updateWorkspace } from "../actions";
import { useOpenAvatarPicker } from "../contexts/OpenAvatarProvider";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";

function Avatar() {
  const {
    id,
    avatar: { icon, color },
  } = useWorkspace();
  const { isAvatarPickerOpened, setIsAvatarPickerOpened } =
    useOpenAvatarPicker();

  const [optimisticAvatar, setOptimisticAvatar] = useOptimistic({
    icon,
    color,
  });

  function saveAvatar(update: { icon?: IconsRegistry; color?: ColorsToken }) {
    const current = optimisticAvatar;
    const unchanged =
      (update.icon === undefined || update.icon === current.icon) &&
      (update.color === undefined || update.color === current.color);
    if (unchanged) return;

    startTransition(async () => {
      setOptimisticAvatar({ ...current, ...update });
      const state = await updateWorkspace(id, { avatar: update });

      if (state.status === "error") {
        setOptimisticAvatar(current);
        window.toast?.error(formatErrorForToast(state.error), 7);
      }
    });
  }

  return (
    <AvatarWithPickerMenu
      isAvatarPickerMenuOpen={isAvatarPickerOpened}
      setIsAvatarPickerMenuOpen={setIsAvatarPickerOpened}
      curAvatarIcon={optimisticAvatar.icon}
      selectedIcon={
        isAvatarIcon(optimisticAvatar.icon)
          ? (optimisticAvatar.icon as IconsRegistry)
          : null
      }
      selectedColor={optimisticAvatar.color}
      setSelectedIcon={(icon) => saveAvatar({ icon })}
      setSelectedColor={(color) => saveAvatar({ color })}
    />
  );
}

export default memo(Avatar);
