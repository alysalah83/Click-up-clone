"use client";

import { Task } from "@/features/task/types";
import { useDraggable } from "@dnd-kit/core";
import CalendarTaskRowView from "./CalendarTaskRowView";

interface CalendarTaskRowProps {
  task: Task;
  cellDate: Date;
}

function CalendarTaskRow({ task, cellDate }: CalendarTaskRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${task.id}-${cellDate.toISOString()}`,
    data: { task, cellDate },
  });

  return (
    <CalendarTaskRowView
      task={task}
      cellDate={cellDate}
      ref={setNodeRef}
      className={isDragging ? "opacity-40" : undefined}
      dragHandleProps={listeners}
      {...attributes}
    />
  );
}

export default CalendarTaskRow;
