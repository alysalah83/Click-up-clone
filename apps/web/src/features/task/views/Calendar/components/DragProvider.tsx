"use client";

import { ReactNode, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Task } from "@/features/task/types";
import { isSameDay } from "date-fns";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import { shiftTaskDates } from "@/features/task/lib/shiftTaskDates";
import CalendarTaskRowView from "./CalendarTaskRowView";

function DragProvider({ children }: { children: ReactNode }) {
  const { updateTask } = useUpdateTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeCellDate, setActiveCellDate] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    const cellDate = event.active.data.current?.cellDate as Date | undefined;
    setActiveTask(task ?? null);
    setActiveCellDate(cellDate ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveCellDate(null);

    if (!over || !active.data.current) return;

    const task = active.data.current.task as Task;
    const fromCell = active.data.current.cellDate as Date | undefined;
    const toCell = over.data.current?.cellDate as Date | undefined;
    if (!task || !fromCell || !toCell) return;
    if (isSameDay(fromCell, toCell)) return;

    const { startDate, endDate } = shiftTaskDates(task, fromCell, toCell);
    if (!startDate) return;

    updateTask({
      taskId: task.id,
      updateTaskInput: { startDate, endDate: endDate ?? undefined },
    });
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeTask && activeCellDate && (
          <CalendarTaskRowView task={activeTask} cellDate={activeCellDate} />
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default DragProvider;
