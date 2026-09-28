import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { AvatarLetters } from "./avatarPicker.types";
import Avatar from "./Avatar";
import IconsPicker from "../IconPicker/IconsPicker";
import { IconsRegistry } from "../IconPicker/types";
import { ColorsToken } from "../ColorPicker/types";
import ColorsPicker from "../ColorPicker/ColorsPicker";
import { Dispatch, SetStateAction } from "react";

interface AvatarWithPickerMenuProps {
  isAvatarPickerMenuOpen?: boolean;
  curAvatarIcon: IconsRegistry | AvatarLetters;
  selectedColor: ColorsToken;
  selectedIcon: IconsRegistry | null;
  setSelectedIcon: (icon: IconsRegistry) => void;
  setSelectedColor: (color: ColorsToken) => void;
  disabled?: boolean;
  withIconPicker?: boolean;
  withColorPicker?: boolean;
  setIsAvatarPickerMenuOpen?: Dispatch<SetStateAction<boolean>>;
}

function AvatarWithPickerMenu({
  isAvatarPickerMenuOpen = false,
  setIsAvatarPickerMenuOpen,
  curAvatarIcon,
  selectedColor,
  selectedIcon,
  setSelectedIcon,
  setSelectedColor,
  withIconPicker = true,
  withColorPicker = true,
  disabled = false,
}: AvatarWithPickerMenuProps) {
  return (
    <span>
      <Menu
        outerIsOpen={isAvatarPickerMenuOpen}
        outerSetIsOpen={setIsAvatarPickerMenuOpen}
      >
        <MenuTrigger>
          <Avatar avatarColor={selectedColor} avatarContent={curAvatarIcon} />
        </MenuTrigger>
        {!disabled && (
          <MenuContent>
            <section className="max-w-56">
              {withColorPicker && (
                <ColorsPicker
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                />
              )}
              {withIconPicker && (
                <IconsPicker
                  selectedIcon={selectedIcon}
                  setSelectedIcon={setSelectedIcon}
                />
              )}
            </section>
          </MenuContent>
        )}
      </Menu>
    </span>
  );
}

export default AvatarWithPickerMenu;
