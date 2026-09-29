import { addDays, differenceInCalendarDays } from "date-fns";

/**
 * Shift a task's start/end dates by the number of calendar days between
 * `fromCell` (the cell the drag started in) and `toCell` (the cell it was
 * dropped on). This preserves the offset the user grabbed the row at,
 * instead of snapping the task's start date to the drop cell.
 */
export function shiftTaskDates(
  task: { startDate: Date | string | null; endDate: Date | string | null },
  fromCell: Date,
  toCell: Date,
) {
  const diff = differenceInCalendarDays(toCell, fromCell);
  const shift = (d: Date | string | null) =>
    d ? addDays(new Date(d), diff) : null;
  return { startDate: shift(task.startDate), endDate: shift(task.endDate) };
}
