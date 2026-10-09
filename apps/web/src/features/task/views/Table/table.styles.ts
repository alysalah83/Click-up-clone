import type { CSSProperties } from "react";

/**
 * One track per built-in column (checkbox, name, assignee, status, due date, priority, points, created at),
 * then one per custom field and the "+" column. Only the name column grows. The template comes from
 * `--table-cols` (set by TableTasksLayout).
 */
const BUILT_IN_COLUMNS = ["48px", "minmax(260px,1fr)", "120px", "150px", "150px", "120px", "84px", "140px"];
const BUILT_IN_MIN_PX = 48 + 260 + 120 + 150 + 150 + 120 + 84 + 140;
const CUSTOM_COLUMN_PX = 168;
const ADD_COLUMN_PX = 44;
const containerGridClasses = "grid grid-cols-[var(--table-cols)]";

/** The table's grid template and minimum width for `fieldCount` custom field columns. */
function tableGridStyle(fieldCount: number) {
  return {
    "--table-cols": `${BUILT_IN_COLUMNS.join(" ")} repeat(${fieldCount},${CUSTOM_COLUMN_PX}px) ${ADD_COLUMN_PX}px`,
    minWidth: `${BUILT_IN_MIN_PX + fieldCount * CUSTOM_COLUMN_PX + ADD_COLUMN_PX}px`,
  } as CSSProperties;
}
/** Keeps the checkbox and name columns in view while the table scrolls sideways. */
const stickyCheckClasses = "sticky left-0 z-[1] bg-inherit";
const stickyNameClasses = "sticky left-12 z-[1] bg-inherit";
const slotBorderClasses = "border-r border-neutral-300 dark:border-neutral-700";
const slotPadding = "p-2";
const headerSlotHoverClasses =
  "cursor-pointer transition duration-200 hover:bg-neutral-200/30 active:bg-neutral-200/30 dark:hover:bg-neutral-500/30 dark:active:bg-neutral-500/30";
const slotHoverClasses =
  "ring-neutral-400 dark:ring-neutral-500 transition duration-200 hover:ring-2 active:ring-2";
const iconsSize = "size-4.5";

export {
  tableGridStyle,
  stickyCheckClasses,
  stickyNameClasses,
  slotBorderClasses,
  slotPadding,
  headerSlotHoverClasses,
  containerGridClasses,
  slotHoverClasses,
  iconsSize,
};
