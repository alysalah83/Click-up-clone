"use client";

import { useParams } from "next/navigation";
import { useUpdateTasks } from "../../hooks/useUpdateTasks";
import TaskPriorityMenuList from "../PriorityMenu";
import { Task } from "../../types";

function PrioritiesUpdater({ tasksId }: { tasksId: Set<string> }) {
  const { updateTasks } = useUpdateTasks();

  const updatePriorities = (priority: Task["priority"]) =>
    updateTasks({
      tasksId,
      updateTasksInput: {
        priority,
      },
    });

  return <TaskPriorityMenuList action={updatePriorities} />;
}

export default PrioritiesUpdater;
