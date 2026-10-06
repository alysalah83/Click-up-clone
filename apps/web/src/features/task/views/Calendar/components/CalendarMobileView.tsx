"use client";

import { useState } from "react";
import {
  addDays,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isToday,
  lastDayOfMonth,
  getDate,
  startOfWeek,
} from "date-fns";
import { Task } from "@/features/task/types";
import { useOpenTask } from "@/features/taskDetail/hooks/useTaskParam";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";
import {
  CALENDAR_PRIORITY_DOTS,
  CALENDER_PRIORITY_COLORS,
  DAY_NAMES,
} from "../calendar.consts";
import { getTasksForDay } from "../getTaskForDay";
import { CalendarView } from "./CalendarLayout";
import CreateTaskRow from "./CreateTaskRow";

const MAX_DOTS = 3;

interface CalendarMobileViewProps {
  currentDate: Date;
  tasks: Task[];
  view: CalendarView;
}

/**
 * Phone (< md) calendar: a compact month grid (day number + priority dots) with the picked day's
 * tasks listed below it, or a week agenda. No drag and drop; tapping a task opens its panel.
 */
function CalendarMobileView({ currentDate, tasks, view }: CalendarMobileViewProps) {
  const [picked, setPicked] = useState<Date | null>(null);

  const inRange = (date: Date) =>
    view === "month"
      ? isSameMonth(date, currentDate)
      : isSameWeek(date, currentDate, { weekStartsOn: 0 });
  const today = new Date();
  const fallback = inRange(today)
    ? today
    : view === "month"
      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      : startOfWeek(currentDate, { weekStartsOn: 0 });
  const selected = picked && inRange(picked) ? picked : fallback;

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      {view === "month" ? (
        <>
          <MobileMonthGrid
            currentDate={currentDate}
            tasks={tasks}
            selected={selected}
            onSelect={setPicked}
          />
          <MobileDayAgenda
            key={selected.toDateString()}
            date={selected}
            tasks={getTasksForDay(tasks, selected)}
          />
        </>
      ) : (
        Array.from({ length: 7 }, (_, i) =>
          addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), i),
        ).map((day) => (
          <MobileDayAgenda
            key={day.toDateString()}
            date={day}
            tasks={getTasksForDay(tasks, day)}
          />
        ))
      )}
    </section>
  );
}

function MobileMonthGrid({
  currentDate,
  tasks,
  selected,
  onSelect,
}: {
  currentDate: Date;
  tasks: Task[];
  selected: Date;
  onSelect: (date: Date) => void;
}) {
  const daysInMonth = getDate(lastDayOfMonth(currentDate));
  const firstDayOffset = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  return (
    <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-700">
      {DAY_NAMES.map((name) => (
        <div
          key={name}
          className="py-1.5 text-center text-[11px] font-semibold text-neutral-400 uppercase"
        >
          {name.charAt(0)}
        </div>
      ))}

      {Array.from({ length: firstDayOffset }, (_, i) => (
        <div key={`pad-${i}`} />
      ))}

      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          day,
        );
        const dayTasks = getTasksForDay(tasks, date);
        const isSelected = isSameDay(date, selected);
        const today = isToday(date);

        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(date)}
            aria-label={`${format(date, "EEEE, MMMM d")}, ${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}`}
            aria-pressed={isSelected}
            className={cn(
              "flex h-12 flex-col items-center gap-1 rounded-md pt-1 transition-colors",
              isSelected
                ? "bg-indigo-50 dark:bg-indigo-900/30"
                : "active:bg-neutral-100 dark:active:bg-neutral-800",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                today
                  ? "bg-indigo-600 text-white"
                  : isSelected
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-neutral-600 dark:text-neutral-300",
              )}
            >
              {day}
            </span>
            {dayTasks.length > 0 && (
              <span className="flex items-center gap-0.5" aria-hidden>
                {dayTasks.length > MAX_DOTS ? (
                  <span className="text-[10px] leading-none font-medium text-neutral-500 dark:text-neutral-400">
                    +{dayTasks.length}
                  </span>
                ) : (
                  dayTasks.map((task) => (
                    <span
                      key={task.id}
                      className={`size-1.5 rounded-full ${CALENDAR_PRIORITY_DOTS[task.priority]}`}
                    />
                  ))
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MobileDayAgenda({ date, tasks }: { date: Date; tasks: Task[] }) {
  const openTask = useOpenTask();
  const [isAdding, setIsAdding] = useState(false);
  const today = isToday(date);

  return (
    <div className="border-b border-neutral-200 px-3 py-3 dark:border-neutral-700">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3
          className={cn(
            "text-sm font-semibold",
            today
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-neutral-700 dark:text-neutral-200",
          )}
        >
          {format(date, "EEE, MMM d")}
          {today && <span className="ml-1.5 text-xs font-medium">Today</span>}
        </h3>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label={`add task on ${format(date, "MMMM d")}`}
        >
          <ICONS_MAP.plus className="size-3 fill-current" />
          Add task
        </button>
      </div>

      {isAdding && (
        <div className="mb-2">
          <CreateTaskRow onClose={() => setIsAdding(false)} cellDate={date} />
        </div>
      )}

      {tasks.length === 0 ? (
        !isAdding && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            No tasks
          </p>
        )
      ) : (
        <ul className="flex flex-col gap-1">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => openTask(task.id)}
                className={`flex w-full items-center gap-2 rounded-md border-l-2 px-2.5 py-2 text-left text-sm font-medium ${CALENDER_PRIORITY_COLORS[task.priority]}`}
              >
                <span className="min-w-0 flex-1 truncate">{task.name}</span>
                {task.startDate &&
                  task.endDate &&
                  !isSameDay(new Date(task.startDate), new Date(task.endDate)) && (
                    <span className="shrink-0 text-[11px] font-normal opacity-80">
                      {format(new Date(task.startDate), "MMM d")} –{" "}
                      {format(new Date(task.endDate), "MMM d")}
                    </span>
                  )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CalendarMobileView;
