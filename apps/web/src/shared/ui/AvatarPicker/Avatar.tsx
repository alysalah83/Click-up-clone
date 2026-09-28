import { memo } from "react";
import { AvatarLetters } from "./avatarPicker.types";
import { isAvatarIcon } from "./helper";
import { ColorsToken } from "../ColorPicker/types";
import { IconsRegistry } from "../IconPicker/types";
import { COLORS_TOKENS } from "../ColorPicker/colorTokens";
import { ICONS_REGISTRY } from "../IconPicker/IconRegistry";

interface AvatarProps {
  avatarColor: ColorsToken;
  avatarContent?: IconsRegistry | AvatarLetters;
  size?: "medium" | "small";
  disabled?: boolean;
}

function Avatar({ avatarContent, disabled, avatarColor, size }: AvatarProps) {
  const bgColor = COLORS_TOKENS[avatarColor].bg;
  let isIcon;
  if (avatarContent) isIcon = isAvatarIcon(avatarContent);

  const Icon = isIcon
    ? ICONS_REGISTRY[avatarContent as keyof typeof ICONS_REGISTRY]
    : null;

  return (
    <button
      disabled={disabled}
      type="button"
      className={`${bgColor} ${size === "small" ? "rounded-sm p-[0.75px] text-sm leading-2" : "rounded-lg p-1 text-base leading-2.5"} shrink-0 cursor-pointer border border-neutral-300 font-semibold text-neutral-100 transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-neutral-700`}
    >
      {isIcon ? (
        Icon && (
          <Icon
            className={`${size === "small" ? "size-4" : "size-5"} fill-neutral-300 text-neutral-300`}
          />
        )
      ) : (
        <p
          className={` ${size === "small" ? "h-4 w-4 leading-4" : "h-5 w-5 leading-4.5"} `}
        >
          {avatarContent}
        </p>
      )}
    </button>
  );
}

export default memo(Avatar);
