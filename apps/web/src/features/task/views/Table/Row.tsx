import { memo, useState } from "react";
import { useCheckTask } from "../../context/CheckTaskProvider";
import TaskNameSlot from "./TaskNameSlot";
import TaskDateSlot from "./TaskDateSlot";
import TableSlotPriority from "./TaskPrioritySlot";
import CheckBoxSlot from "./CheckBoxSlot";
import TaskStatusSlot from "./TaskStatusSlot";
import TaskCreatedAtSlot from "./TaskCreatedAtSlot";
import { Task } from "../../types";
import { useTask } from "../../context/TaskProvider";
import { shouldOpenTaskDetail } from "../../lib/shouldOpenTaskDetail";
import { useOpenTask } from "@/features/taskDetail/hooks/useTaskParam";
import { AssigneesButton } from "@/features/members/components/AssigneePicker";
import { containerGridClasses, slotBorderClasses, slotHoverClasses } from "./table.styles";

function Row({ task, sortNum }: { task: Task; sortNum: number }) {
  const { id, priority, status, endDate, startDate, createdAt } = task;
  const { checkedTasksIdSet } = useCheckTask();
  const { isRenameOpen, isTempTask } = useTask();
  const openTask = useOpenTask();
  const isTaskChecked = checkedTasksIdSet.has(id);
  const isTaskTemp = id.includes("temp");

  const [isTaskRowHovered, setIsTaskRowHovered] = useState(false);
  const handleTaskRowHovered = () => setIsTaskRowHovered(true);
  const handleTaskRowNotHovered = () => setIsTaskRowHovered(false);

  return (
    <main
      onClick={(e) => {
        if (
          shouldOpenTaskDetail({
            target: e.target as Element,
            currentTarget: e.currentTarget,
            isRenameOpen,
            isTempTask,
          })
        )
          openTask(id);
      }}
      onPointerEnter={handleTaskRowHovered}
      onPointerLeave={handleTaskRowNotHovered}
      className={`${containerGridClasses} border-b border-neutral-200 ${isTaskTemp ? "pointer-events-none opacity-60" : ""} dark:border-neutral-800 ${isTaskChecked ? "bg-neutral-200 dark:bg-neutral-500/30" : "bg-white hover:bg-indigo-50/60 active:bg-indigo-50 dark:bg-neutral-900/50 dark:hover:bg-neutral-500/20 dark:active:bg-neutral-500/20"} text-sm font-medium text-neutral-600 transition duration-200 dark:text-neutral-300`}
    >
      <CheckBoxSlot isTaskRowHovered={isTaskRowHovered} sortNum={sortNum} />
      <TaskNameSlot />
      <div className={`col-span-2 flex items-center px-2 py-1 ${slotBorderClasses} ${slotHoverClasses}`}>
        <AssigneesButton task={task} size="sm" />
      </div>
      <TaskStatusSlot status={status} />
      <TaskDateSlot startDate={startDate} endDate={endDate} />
      <TableSlotPriority priority={priority} />
      <TaskCreatedAtSlot createdAt={createdAt} />
    </main>
  );
}

export default memo(Row);
