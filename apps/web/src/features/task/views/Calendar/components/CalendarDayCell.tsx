"use client";

import { Task } from "@/features/task/types";
import CalendarTaskRow from "./CalendarTaskRow";
import AddTaskButton from "./AddTaskButton";
import { useDroppable } from "@dnd-kit/core";

interface CalendarDayCellProps {
  day: number | null;
  isToday: boolean;
  isCurrentMonth: boolean;
  cellDate: Date;
  tasks: Task[];
}

function CalendarDayCell({
  day,
  isToday,
  isCurrentMonth,
  cellDate,
  tasks,
}: CalendarDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: cellDate.toISOString(),
    data: { cellDate },
  });

  if (day === null) {
    return (
      <div className="min-h-[120px] min-w-[120px] border-r border-b border-neutral-200 bg-neutral-50/50 sm:min-w-[140px] dark:border-neutral-700 dark:bg-neutral-900/30" />
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full min-h-[120px] min-w-[120px] shrink-0 flex-col gap-1 border-r border-b border-neutral-200 p-1.5 transition-colors sm:min-w-[140px] dark:border-neutral-700 ${
        isOver
          ? "bg-indigo-50 dark:bg-indigo-900/20"
          : isCurrentMonth
            ? "bg-neutral-50/50 dark:bg-neutral-900/30"
            : "bg-white dark:bg-neutral-900"
      }`}
    >
      <div className="flex w-full justify-end">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
            isToday
              ? "bg-indigo-600 text-white"
              : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          {day}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto">
        {tasks.map((task) => (
          <CalendarTaskRow
            key={`${task.id}-${cellDate.toISOString()}`}
            task={task}
            cellDate={cellDate}
          />
        ))}
      </div>

      <div className="mt-auto flex w-full justify-end">
        <AddTaskButton cellDate={cellDate} />
      </div>
    </div>
  );
}

export default CalendarDayCell;
