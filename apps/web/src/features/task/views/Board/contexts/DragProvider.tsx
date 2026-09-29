"use client";

import TaskProvider from "@/features/task/context/TaskProvider";
import useTasks from "@/features/task/hooks/useTasks";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import { Task } from "@/features/task/types";
import { shouldMoveTask } from "@/features/task/lib/shouldMoveTask";
import TaskCardView from "@/features/task/views/Board/components/TaskCardView";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ReactNode, useEffect, useState } from "react";

interface DragProviderProps {
  children: ReactNode;
}

function DragProvider({ children }: DragProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { updateTask } = useUpdateTask();
  const { tasks } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  if (!isMounted) return null;

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks?.find((task) => task.id === e.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const activeStatusId = e.active.data.current?.statusId as
      | string
      | undefined;
    if (activeStatusId) {
      const destinationStatusId = shouldMoveTask(activeStatusId, e.over?.id);
      if (destinationStatusId) {
        updateTask({
          taskId: e.active.id as string,
          updateTaskInput: { statusId: destinationStatusId },
        });
      }
    }
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeTask && (
          <TaskProvider task={activeTask}>
            <TaskCardView task={activeTask} />
          </TaskProvider>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default DragProvider;
