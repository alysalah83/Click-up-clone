import { getDate, isSameMonth, isToday, lastDayOfMonth } from "date-fns";
import { DAY_NAMES } from "../calendar.consts";
import CalendarDayCell from "./CalendarDayCell";
import { Task } from "@/features/task/types";
import { getTasksForDay } from "../getTaskForDay";

interface calendarMonthViewProps {
  currentDate: Date;
  tasks: Task[];
}

function CalendarMonthView({ currentDate, tasks }: calendarMonthViewProps) {
  const endDayOfMonth = getDate(lastDayOfMonth(currentDate));
  const firstDayOffset = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();
  const totalCells = firstDayOffset + endDayOfMonth;
  const rows = Math.ceil(totalCells / 7);

  return (
    <section className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
      <div
        className="grid min-w-[840px]"
        style={{
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: `auto repeat(${rows}, 1fr)`,
          minHeight: "100%",
        }}
      >
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="border-r border-b border-neutral-200 px-2 py-1.5 text-center text-xs font-semibold text-neutral-400 uppercase dark:border-neutral-700"
          >
            {name}
          </div>
        ))}

        {/* Empty padding cells before day 1 */}
        {Array.from({ length: firstDayOffset }, (_, i) => (
          <div
            key={`pad-${i}`}
            className="min-h-[120px] border-r border-b border-neutral-200 bg-neutral-50/30 dark:border-neutral-700 dark:bg-neutral-900/20"
          />
        ))}

        {/* Day cells */}
        {Array.from({ length: endDayOfMonth }, (_, i) => i + 1).map((day) => {
          const cellDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day,
          );

          return (
            <CalendarDayCell
              day={day}
              isToday={isToday(cellDate)}
              isCurrentMonth={isSameMonth(currentDate, new Date())}
              cellDate={cellDate}
              tasks={getTasksForDay(tasks, cellDate)}
              key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`}
            />
          );
        })}
      </div>
    </section>
  );
}

export default CalendarMonthView;
