import { TaskDateRange } from "../types";

/**
 * Fills in `null` start/end dates with "now", matching the defaults the old
 * DatePicker-backed DateUpdater used (`startDate || new Date()`,
 * `endDate || new Date()`) before it was seeded straight from the task.
 * Without this, confirming a date range for a task whose `startDate` is
 * still `null` (never set) would save `startDate: null` instead of a real
 * date, because DateRangePicker's own initial state only defaults `endDate`.
 */
function withDateDefaults(range: TaskDateRange): TaskDateRange {
  return {
    startDate: range.startDate ?? new Date(),
    endDate: range.endDate ?? new Date(),
  };
}

export { withDateDefaults };
