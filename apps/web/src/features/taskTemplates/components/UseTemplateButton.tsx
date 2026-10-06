"use client";

import { LayoutTemplate } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import { useTemplatePicker } from "../store";
import type { TemplateTarget } from "../types";

/** "Templates" in an add-task form: opens the template picker for this list and status. */
function UseTemplateButton({
  target,
  onOpen,
  className,
  label = "Templates",
}: {
  target: TemplateTarget;
  /** Runs after the picker opens (e.g. to close the inline add-task form). */
  onOpen?: () => void;
  className?: string;
  label?: string;
}) {
  const openPicker = useTemplatePicker((s) => s.openPicker);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openPicker(target);
        onOpen?.();
      }}
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-md border border-neutral-300 px-2 py-0.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700/60",
        className,
      )}
    >
      <LayoutTemplate aria-hidden className="size-3.5" />
      {label}
    </button>
  );
}

export default UseTemplateButton;
