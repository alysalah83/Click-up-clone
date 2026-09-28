import { startOfDay } from "date-fns";
import { Task } from "../../types";

export function getTasksForDay(tasks: Task[], cellDate: Date): Task[] {
  const cell = startOfDay(cellDate);
  return tasks.filter((task) => {
    if (!task.startDate) return false;
    const start = startOfDay(new Date(task.startDate));
    const end = task.endDate ? startOfDay(new Date(task.endDate)) : start;
    return cell >= start && cell <= end;
  });
}
