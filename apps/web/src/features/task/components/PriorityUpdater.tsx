"use client";

import { useUpdateTask } from "../hooks/useUpdateTask";
import { useTask } from "../context/TaskProvider";
import PriorityMenu from "./PriorityMenu";
import { Task } from "../types";

function PriorityUpdater() {
  const {
    task: { id },
  } = useTask();
  const { updateTask } = useUpdateTask();

  const updatePriority = (priority: Task["priority"]) =>
    updateTask({
      taskId: id,
      updateTaskInput: {
        priority,
      },
    });

  return <PriorityMenu action={updatePriority} />;
}

export default PriorityUpdater;
