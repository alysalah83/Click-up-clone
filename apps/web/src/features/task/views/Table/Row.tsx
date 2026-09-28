import { memo, useState } from "react";
import { useCheckTask } from "../../context/CheckTaskProvider";
import TaskNameSlot from "./TaskNameSlot";
import TaskDateSlot from "./TaskDateSlot";
import TableSlotPriority from "./TaskPrioritySlot";
import CheckBoxSlot from "./CheckBoxSlot";
import TaskStatusSlot from "./TaskStatusSlot";
import TaskCreatedAtSlot from "./TaskCreatedAtSlot";
import { containerGridClasses } from "./table.styles";
import { Task } from "../../types";

function Row({ task, sortNum }: { task: Task; sortNum: number }) {
  const { id, priority, status, endDate, startDate, createdAt } = task;
  const { checkedTasksIdSet } = useCheckTask();
  const isTaskChecked = checkedTasksIdSet.has(id);
  const isTaskTemp = id.includes("temp");

  const [isTaskRowHovered, setIsTaskRowHovered] = useState(false);
  const handleTaskRowHovered = () => setIsTaskRowHovered(true);
  const handleTaskRowNotHovered = () => setIsTaskRowHovered(false);

  return (
    <main
      onPointerEnter={handleTaskRowHovered}
      onPointerLeave={handleTaskRowNotHovered}
      className={`${containerGridClasses} border-b border-neutral-300 ${isTaskTemp ? "pointer-events-none opacity-60" : ""} dark:border-neutral-700 ${isTaskChecked ? "bg-neutral-200 dark:bg-neutral-500/30" : "bg-neutral-50 hover:bg-neutral-200/20 active:bg-neutral-200/20 dark:bg-neutral-900/50 dark:hover:bg-neutral-500/20 dark:active:bg-neutral-500/20"} text-sm font-medium text-neutral-600 transition duration-200 dark:text-neutral-300`}
    >
      <CheckBoxSlot isTaskRowHovered={isTaskRowHovered} sortNum={sortNum} />
      <TaskNameSlot />
      <TaskStatusSlot status={status} />
      <TaskDateSlot startDate={startDate} endDate={endDate} />
      <TableSlotPriority priority={priority} />
      <TaskCreatedAtSlot createdAt={createdAt} />
    </main>
  );
}

export default memo(Row);
