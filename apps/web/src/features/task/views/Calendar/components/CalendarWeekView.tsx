import { addDays, isSameMonth, isToday, startOfWeek } from "date-fns";
import { DAY_NAMES } from "../calendar.consts";
import CalendarDayCell from "./CalendarDayCell";
import { getTasksForDay } from "../getTaskForDay";
import { Task } from "@/features/task/types";
interface CalendarWeekViewProps {
  currentDate: Date;
  tasks: Task[];
}

function CalendarWeekView({ currentDate, tasks }: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <section className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
      <div
        className="grid min-h-full min-w-[840px] grid-cols-7"
        style={{ gridTemplateRows: "auto 1fr" }}
      >
        {weekDays.map((_day, i) => (
          <div
            key={i}
            className="border-r border-b border-neutral-200 px-2 py-1.5 text-center text-xs font-semibold text-neutral-400 uppercase dark:border-neutral-700"
          >
            {DAY_NAMES[i]}
          </div>
        ))}

        {weekDays.map((day) => (
          <CalendarDayCell
            key={day.toISOString()}
            day={day.getDate()}
            isToday={isToday(day)}
            isCurrentMonth={isSameMonth(day, new Date())}
            cellDate={day}
            tasks={getTasksForDay(tasks, day)}
          />
        ))}
      </div>
    </section>
  );
}

export default CalendarWeekView;
