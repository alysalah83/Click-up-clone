import type { CSSProperties } from "react";

/**
 * 21 shared columns for the built-in slots, then one per custom field and the "+" column. The template
 * comes from `--table-cols` (set by TableTasksLayout); without it, the plain 21 columns.
 */
const containerGridClasses = "grid grid-cols-[var(--table-cols,repeat(21,minmax(0,1fr)))]";
const CUSTOM_COLUMN_PX = 168;
const ADD_COLUMN_PX = 44;

/** The table's grid template and minimum width for `fieldCount` custom field columns. */
function tableGridStyle(fieldCount: number) {
  return {
    "--table-cols": `repeat(21,minmax(28px,1fr)) repeat(${fieldCount},${CUSTOM_COLUMN_PX}px) ${ADD_COLUMN_PX}px`,
    minWidth: `calc(48rem + ${fieldCount * CUSTOM_COLUMN_PX + ADD_COLUMN_PX}px)`,
  } as CSSProperties;
}
const slotBorderClasses = "border-r border-neutral-300 dark:border-neutral-700";
const slotPadding = "p-2";
const headerSlotHoverClasses =
  "cursor-pointer transition duration-200 hover:bg-neutral-200/30 active:bg-neutral-200/30 dark:hover:bg-neutral-500/30 dark:active:bg-neutral-500/30";
const slotHoverClasses =
  "ring-neutral-400 dark:ring-neutral-500 transition duration-200 hover:ring-2 active:ring-2";
const iconsSize = "size-4.5";

export {
  tableGridStyle,
  slotBorderClasses,
  slotPadding,
  headerSlotHoverClasses,
  containerGridClasses,
  slotHoverClasses,
  iconsSize,
};
