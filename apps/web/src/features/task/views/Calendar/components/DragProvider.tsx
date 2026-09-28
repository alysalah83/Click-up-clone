import { ReactNode } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Task } from "@/features/task/types";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";

function DragProvider({ children }: { children: ReactNode }) {
  const { updateTask } = useUpdateTask();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const task = active.data.current.task as Task;
    const newStartDate = over.data.current?.cellDate as Date;
    if (!newStartDate || !task.startDate) return;

    const oldStart = startOfDay(new Date(task.startDate));
    const diff = differenceInCalendarDays(newStartDate, oldStart);
    if (diff === 0) return;

    const updatedStart = addDays(oldStart, diff);
    const updatedEnd = task.endDate
      ? addDays(startOfDay(new Date(task.endDate)), diff)
      : undefined;

    updateTask({
      taskId: task.id,
      updateTaskInput: { startDate: updatedStart, endDate: updatedEnd },
    });
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  );
}

export default DragProvider;
