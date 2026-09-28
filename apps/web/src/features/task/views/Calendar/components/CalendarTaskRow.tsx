"use client";

import { Task } from "@/features/task/types";
import { CALENDER_PRIORITY_COLORS } from "../calendar.consts";
import { useDraggable } from "@dnd-kit/core";
import { isSameDay } from "date-fns";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { TaskOptionsButton } from "@/features/task/components/TaskDetailPanel";

interface CalendarTaskRowProps {
  task: Task;
  cellDate: Date;
}

function CalendarTaskRow({ task, cellDate }: CalendarTaskRowProps) {
  const colorClasses = CALENDER_PRIORITY_COLORS[task.priority];

  const isStart = task.startDate
    ? isSameDay(cellDate, new Date(task.startDate))
    : true;
  const isEnd = task.endDate
    ? isSameDay(cellDate, new Date(task.endDate))
    : true;
  const isSpanning = !isStart || !isEnd;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${task.id}-${cellDate.toISOString()}`,
      data: { task },
    });

  const spanRadius =
    isStart && isEnd
      ? "rounded-md"
      : isStart
        ? "rounded-l-md"
        : isEnd
          ? "rounded-r-md"
          : "";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `transform3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      className={`flex shrink-0 items-center gap-2 truncate border-l-2 px-2 py-1 text-sm font-medium ${colorClasses} ${spanRadius} ${
        isSpanning && !isEnd ? "border-r-0" : ""
      } ${isSpanning && !isStart ? "border-l-0" : ""}`}
      title={task.name}
    >
      <div
        {...listeners}
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
      >
        <ICONS_MAP.dragHandle className="h-3 w-3 text-current opacity-50" />
      </div>

      <span className="flex-1 truncate">
        {isStart ? task.name : <span className="opacity-0 select-none">·</span>}
      </span>

      <div className="ml-auto shrink-0">
        <TaskOptionsButton task={task} />
      </div>
    </div>
  );
}

export default CalendarTaskRow;
