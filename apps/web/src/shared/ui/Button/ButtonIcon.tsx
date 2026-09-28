import {
  hoverElementClasses,
  hoverElementWithBgClasses,
  sizeClasses,
} from "@/shared/constants/styles";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import React, { memo } from "react";
import clsx from "clsx";
import type { StylesSizes } from "@/shared/types/index.types";
import { IconsMap } from "@/shared/icons/icons.type";

const iconPaddingClasses = {
  xSmall: "p-0.5",
  small: "p-1",
  medium: "p-[6px]",
  large: "p-2",
  xLarge: "p-3",
} as const;

type PaddingType = keyof typeof iconPaddingClasses;

interface ButtonIconProps {
  icon: IconsMap;
  iconColor?: string;
  label?: string;
  labelSize?: StylesSizes;
  ariaLabel: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  withBg?: boolean;
  bgColor?: `bg-${string}-${number}/${number}`;
  bgHoverColor?: `hover:bg-${string}-${number}/${number} active:bg-${string}-${number}/${number}`;
  size?: number;
  padding?: PaddingType;
  type?: "default" | "primary" | "bordered";
  isActive?: boolean;
  btnType?: HTMLButtonElement["type"];
  disabled?: boolean;
  disabledIconColor?: string;
}

function ButtonIcon({
  icon,
  iconColor = "",
  label,
  labelSize = "small",
  ariaLabel,
  withBg = false,
  bgColor,
  bgHoverColor,
  size = 5,
  padding = "medium",
  type = "default",
  isActive = false,
  onClick,
  btnType = "button",
  disabled = false,
  disabledIconColor,
}: ButtonIconProps) {
  if (type === "default" && isActive)
    throw new Error("buttonIcon with default type cannot be active");

  const Icon = ICONS_MAP[icon];

  const buttonClasses = clsx(
    "rounded-lg transition duration-300 disabled:cursor-not-allowed",
    iconPaddingClasses[padding],
    !isActive &&
      !bgHoverColor &&
      !bgColor &&
      (withBg ? hoverElementWithBgClasses : hoverElementClasses),

    {
      "disable:bg-neutral-300/20 dark:disabled:bg-neutral-700/20":
        !bgColor && !bgHoverColor,
    },

    bgColor && `${bgColor} cursor-pointer`,
    bgHoverColor && `cursor-pointer`,
    {
      "bg-neutral-300/15 dark:bg-neutral-800/15 border border-neutral-300 dark:border-neutral-600":
        type === "bordered",
      "bg-neutral-950 dark:bg-neutral-50": type === "primary" && isActive,
    },
  );

  const iconClasses = clsx(
    "transition duration-300",
    sizeClasses[size],
    iconColor,
    disabledIconColor,
    type === "default" &&
      !iconColor &&
      "fill-neutral-500 text-neutral-500 dark:fill-neutral-400 dark:text-neutral-400",
    type === "primary" &&
      isActive &&
      "fill-neutral-50 dark:fill-neutral-950 text-neutral-50 dark:text-neutral-950",
    type === "primary" &&
      !isActive &&
      "fill-neutral-800 dark:fill-neutral-200 dark:text-neutral-200",
    type === "bordered" &&
      !iconColor &&
      "fill-neutral-neutral-500 text-neutral-500 dark:fill-neutral-400 dark:text-neutral-400",
    label && "shrink-0",
  );

  const labelClasses = clsx("text-nowrap", {
    "text-xs font-medium text-neutral-600 dark:text-neutral-400":
      labelSize === "small",
    "text-sm font-medium": labelSize === "medium",
    "text-base": labelSize === "large",
  });

  return (
    <button
      onClick={onClick}
      className={buttonClasses}
      aria-label={ariaLabel}
      type={btnType}
      disabled={disabled}
    >
      {label ? (
        <span className="flex items-center gap-1.5 px-1">
          <Icon className={iconClasses} />
          <span className={labelClasses}>{label}</span>
        </span>
      ) : (
        <Icon className={iconClasses} />
      )}
    </button>
  );
}

export default memo(ButtonIcon);
