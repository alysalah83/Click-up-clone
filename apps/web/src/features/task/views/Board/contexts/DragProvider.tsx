"use client";

import TaskProvider from "@/features/task/context/TaskProvider";
import useTasks from "@/features/task/hooks/useTasks";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import { Task } from "@/features/task/types";
import TaskCard from "@/features/task/views/Board/components/TaskCard";
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
    if (
      e.over &&
      e.active.data.current &&
      e.over.id !== e.active.data.current.status
    ) {
      updateTask({
        taskId: e.active.id as string,
        updateTaskInput: { statusId: e.over.id as Task["statusId"] },
      });
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
            <TaskCard task={activeTask} />
          </TaskProvider>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default DragProvider;
