import { StylesSizes } from "@/shared/types/index.types";
import clsx from "clsx";
import { memo } from "react";
import { ICONS_REGISTRY } from "@/shared/ui/IconPicker/IconRegistry";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";

interface StatusBadgeProps {
  status: string;
  icon: string;
  bgColor: string;
  size?: StylesSizes;
}

function StatusBadge({
  status,
  icon,
  bgColor,
  size = "medium",
}: StatusBadgeProps) {
  const Icon = ICONS_REGISTRY[icon as IconsRegistry];
  const bgColorClass = COLORS_TOKENS[bgColor as ColorsToken].bg;

  const containerClasses = clsx(
    "flex items-center w-fit rounded-md",
    bgColorClass,
    {
      "px-1.5 py-1 gap-1": size === "small",
      "px-2 py-1 gap-1.5": size === "medium",
      "px-2.5 py-1.5 gap-2": size === "large",
    },
  );

  const taskNameClasses = clsx(
    "text-neutral-50 uppercase text-nowrap text-ellipsis",
    {
      "text-xs font-semibold": size === "small",
      "text-sm font-medium": size === "medium",
      "text-base font-medium": size === "large",
    },
  );

  return (
    <div className={containerClasses}>
      <span>
        <Icon className="h-4 w-4 fill-neutral-50 text-neutral-50" />
      </span>
      <span className={taskNameClasses}>{status}</span>
    </div>
  );
}

export default memo(StatusBadge);
