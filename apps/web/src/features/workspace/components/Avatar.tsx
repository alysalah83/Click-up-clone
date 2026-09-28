"use client";

import { memo, useEffect, useState } from "react";
import { AvatarWithPickerMenu } from "@/shared/ui/AvatarPicker";
import { useWorkspace } from "../contexts/WorkspaceProvider";
import { updateWorkspace } from "../actions";
import { useOpenAvatarPicker } from "../contexts/OpenAvatarProvider";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";

function Avatar() {
  const {
    id,
    avatar: { icon, color },
  } = useWorkspace();
  const { isAvatarPickerOpened, setIsAvatarPickerOpened } =
    useOpenAvatarPicker();
  const [selectedIcon, setSelectedIcon] = useState<IconsRegistry | null>(null);
  const [selectedColor, setSelectedColor] = useState(color);

  useEffect(() => {
    updateWorkspace(id, {
      avatar: { color, icon },
    });
  }, [color, icon, id]);

  return (
    <AvatarWithPickerMenu
      isAvatarPickerMenuOpen={isAvatarPickerOpened}
      setIsAvatarPickerMenuOpen={setIsAvatarPickerOpened}
      curAvatarIcon={selectedIcon || icon}
      selectedIcon={selectedIcon}
      selectedColor={selectedColor}
      setSelectedIcon={setSelectedIcon}
      setSelectedColor={setSelectedColor}
    />
  );
}

export default memo(Avatar);
