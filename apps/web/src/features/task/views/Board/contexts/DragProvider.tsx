"use client";

import TaskProvider from "@/features/task/context/TaskProvider";
import useTasks from "@/features/task/hooks/useTasks";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import { Task, UpdateTaskInput } from "@/features/task/types";
import TaskCardView from "@/features/task/views/Board/components/TaskCardView";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { useSetAssignees } from "@/features/members/hooks/useSetAssignees";
import type { Swimlanes } from "@/features/viewConfig/types";
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
import { BoardDropPoint, dropExceedsWip, Lane, moveAssignee, resolveBoardDrop } from "../lib/swimlanes";

interface DragProviderProps {
  children: ReactNode;
  /** Swimlane mode of the board; a cross-lane drop changes this field. */
  swimlanes?: Swimlanes;
  lanes?: Lane[];
}

function DragProvider({ children, swimlanes = "none", lanes }: DragProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { updateTask } = useUpdateTask();
  const { setAssignees } = useSetAssignees();
  const { tasks } = useTasks();
  const { statuses } = useStatuses();
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

  const taskIdOf = (e: DragStartEvent | DragEndEvent) =>
    (e.active.data.current?.taskId as string | undefined) ?? String(e.active.id);

  const handleDragStart = (e: DragStartEvent) => {
    const id = taskIdOf(e);
    const task = tasks?.find((task) => task.id === id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const from = e.active.data.current as BoardDropPoint | undefined;
    if (!from?.statusId) return;
    const move = resolveBoardDrop(from, e.over?.data.current as BoardDropPoint | undefined);
    if (!move) return;

    const taskId = taskIdOf(e);
    const task = tasks?.find((t) => t.id === taskId);
    const patch: UpdateTaskInput = {};

    if (move.statusId) {
      patch.statusId = move.statusId;
      const target = statuses?.find((s) => s.id === move.statusId);
      const countBefore = tasks?.filter((t) => t.statusId === move.statusId).length ?? 0;
      if (target && dropExceedsWip(countBefore, target.wipLimit)) {
        window.toast?.warning?.(`WIP limit exceeded in "${target.name}" (${countBefore + 1} of ${target.wipLimit})`);
      }
    }

    if (move.lane && swimlanes === "priority") {
      patch.priority = move.lane.to as Task["priority"];
    } else if (move.lane && swimlanes === "assignee" && task) {
      const to = lanes?.find((l) => l.key === move.lane!.to)?.assignee ?? null;
      setAssignees({ taskId, assignees: moveAssignee(task.assignees ?? [], move.lane.from, to) });
    }

    if (Object.keys(patch).length) updateTask({ taskId, updateTaskInput: patch });
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
