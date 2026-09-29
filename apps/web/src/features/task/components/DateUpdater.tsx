"use client";

import { useUpdateTask } from "../hooks/useUpdateTask";
import DateRangePicker from "@/shared/ui/DateRangePicker";
import { useTask } from "../context/TaskProvider";
import { TaskDateRange } from "../types";

function DateUpdater() {
  const { updateTask } = useUpdateTask();
  const {
    task: { id, startDate, endDate },
  } = useTask();

  const handleUpdateDate = function (datesRange: TaskDateRange) {
    // DateRangePicker's Clear always sends { startDate: new Date(), endDate: null };
    // the old DatePicker cleared both dates, so translate that shape back to a full clear.
    const newDates =
      datesRange.endDate === null
        ? { startDate: null, endDate: null }
        : datesRange;

    updateTask({
      taskId: id,
      updateTaskInput: newDates,
    });
  };

  return (
    <DateRangePicker
      dateRanges={{ startDate, endDate }}
      onDateChange={handleUpdateDate}
    />
  );
}
export default DateUpdater;
