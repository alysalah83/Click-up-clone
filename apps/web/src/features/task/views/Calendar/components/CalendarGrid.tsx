import { Task } from "@/features/task/types";
import { CalendarView } from "./CalendarLayout";
import CalendarWeekView from "./CalendarWeekView";
import CalendarMonthView from "./CalendarMonthView";

function CalendarGrid({
  currentDate,
  tasks,
  view,
}: {
  currentDate: Date;
  tasks: Task[];
  view: CalendarView;
}) {
  const props = () => ({
    currentDate,
    tasks,
  });

  return view === "week" ? (
    <CalendarWeekView {...props()} />
  ) : (
    <CalendarMonthView {...props()} />
  );
}

export default CalendarGrid;
