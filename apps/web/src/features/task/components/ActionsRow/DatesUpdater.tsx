import DateRangePicker from "@/shared/ui/DateRangePicker";
import { useUpdateTasks } from "../../hooks/useUpdateTasks";
import { TaskDateRange } from "../../types";

function DatesUpdater({ tasksId }: { tasksId: Set<string> }) {
  const { updateTasks } = useUpdateTasks();

  const handleUpdateDates = function (datesRange: TaskDateRange) {
    // DateRangePicker's Clear always sends { startDate: new Date(), endDate: null };
    // the old DatePicker cleared both dates, so translate that shape back to a full clear.
    const newDates =
      datesRange.endDate === null
        ? { startDate: null, endDate: null }
        : datesRange;

    updateTasks({
      tasksId,
      updateTasksInput: newDates,
    });
  };

  return (
    <DateRangePicker
      dateRanges={{ startDate: new Date(), endDate: new Date() }}
      onDateChange={handleUpdateDates}
    />
  );
}
export default DatesUpdater;
