"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { memo } from "react";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

function Checkbox({ checked, onCheckedChange, disabled = false }: CheckboxProps) {
  const CheckMark = ICONS_MAP.checkMark;
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      disabled={disabled}
      onClick={onCheckedChange}
      aria-label="checkbox"
      className={cn(
        `flex h-4 w-4 ${disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"} items-center justify-center rounded-sm border border-neutral-400 dark:border-neutral-600 ${checked ? "bg-violet-600" : "bg-neutral-50 dark:bg-neutral-900"} `,
        "focus-visible:outline-ring focus-visible:outline-2",
      )}
    >
      <CheckboxPrimitive.Indicator>
        <CheckMark className="h-3 w-3 text-neutral-100 dark:text-neutral-300" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export default memo(Checkbox);
