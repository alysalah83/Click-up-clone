"use client";

import { ComponentPropsWithRef } from "react";
import { Task } from "@/features/task/types";
import { CALENDER_PRIORITY_COLORS } from "../calendar.consts";
import { isSameDay } from "date-fns";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";

interface CalendarTaskRowViewProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  task: Task;
  cellDate: Date;
  dragHandleProps?: ComponentPropsWithRef<"div">;
}

/**
 * Presentational calendar row. It has no `useDraggable`, so it is safe to
 * render a second, non-interactive copy of it inside a `DragOverlay` while
 * the "real" row (the draggable wrapper, `CalendarTaskRow`) stays put
 * underneath.
 */
function CalendarTaskRowView({
  task,
  cellDate,
  dragHandleProps,
  className,
  ...rest
}: CalendarTaskRowViewProps) {
  const colorClasses = CALENDER_PRIORITY_COLORS[task.priority];

  const isStart = task.startDate
    ? isSameDay(cellDate, new Date(task.startDate))
    : true;
  const isEnd = task.endDate
    ? isSameDay(cellDate, new Date(task.endDate))
    : true;
  const isSpanning = !isStart || !isEnd;

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
      className={cn(
        `flex shrink-0 items-center gap-2 truncate border-l-2 px-2 py-1 text-sm font-medium ${colorClasses} ${spanRadius} ${
          isSpanning && !isEnd ? "border-r-0" : ""
        } ${isSpanning && !isStart ? "border-l-0" : ""}`,
        className,
      )}
      title={task.name}
      {...rest}
    >
      <div
        {...dragHandleProps}
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
      >
        <ICONS_MAP.dragHandle className="h-3 w-3 text-current opacity-50" />
      </div>

      <span className="flex-1 truncate">
        {isStart ? task.name : <span className="opacity-0 select-none">·</span>}
      </span>
    </div>
  );
}

export default CalendarTaskRowView;
