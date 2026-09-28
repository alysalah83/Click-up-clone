import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useState } from "react";
import { useMenu } from "@/shared/ui/Menu/MenuCompound";
import { useUpdateTasks } from "../../hooks/useUpdateTasks";
import DatePicker from "../DatePicker";
import { TaskDateRange } from "../../types";

function DatesUpdater({ tasksId }: { tasksId: Set<string> }) {
  const { updateTasks } = useUpdateTasks();
  const { toggleMenu } = useMenu();
  const [date, setDate] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const handleUpdateDates = function (datesRange?: TaskDateRange) {
    const newDates = datesRange ?? { startDate: null, endDate: null };

    updateTasks({
      tasksId,
      updateTasksInput: newDates,
    });
    toggleMenu();
  };

  return (
    <DatePicker action={handleUpdateDates} date={date} setDate={setDate} />
  );
}
export default DatesUpdater;
