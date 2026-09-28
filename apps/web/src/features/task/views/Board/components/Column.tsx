"use client";

import RowAddNew from "@/shared/components/RowAddNew";
import { useActiveColumnForm } from "../contexts/ActiveColumnFormProvider";
import { useDroppable } from "@dnd-kit/core";
import { memo } from "react";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import AddTaskForm from "./AddTaskForm";
import StatusBadge from "@/features/status/components/StatusBadge";
import { Status } from "@/features/status/types";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";
import { BOARD_STATUS_BACKGROUND_COLOR } from "../board.const";
import useTasks from "@/features/task/hooks/useTasks";
import TaskItem from "./TaskItem";
import ColumnFeaturesBtn from "./ColumnFeaturesBtn";

interface ColumnProps {
  statusItem: Status;
}

function Column({ statusItem }: ColumnProps) {
  const { id, icon, name: statusName, bgColor, order } = statusItem;
  const { tasks, isPending } = useTasks();
  const { activeStatusColumn, setActiveColumn } = useActiveColumnForm();
  const { isOver, setNodeRef } = useDroppable({ id });

  const isTempStatus = id.includes("temp");
  const isColumnFormOpened = activeStatusColumn === statusName;
  const statusTasks = tasks?.filter((task) => task.statusId === id);
  const tasksCount = statusTasks?.length;

  const handleActiveColumnForm = () => setActiveColumn(statusName);

  const cardBgColorClass =
    BOARD_STATUS_BACKGROUND_COLOR[bgColor as ColorsToken];

  return (
    <div
      ref={setNodeRef}
      className={`flex h-fit max-h-full w-2xs shrink-0 flex-col gap-1 overflow-y-auto rounded-lg px-1 pt-2 pb-1 ${isTempStatus ? "pointer-events-none opacity-75" : ""} ${cardBgColorClass} ${isOver ? "ring-2 ring-neutral-300 outline-0 dark:ring-neutral-700" : ""} transition-all duration-200`}
    >
      <header className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <StatusBadge status={statusName} icon={icon} bgColor={bgColor} />
          <span className="text-sm text-neutral-600/80 dark:text-neutral-400/80">
            {tasksCount}
          </span>
        </div>
        <ColumnFeaturesBtn
          handleActiveColumn={handleActiveColumnForm}
          statusOrder={order}
          statusId={id}
          statusName={statusName}
        />
      </header>

      <div className="flex flex-col gap-1 overflow-y-auto">
        {isPending ? (
          <SkeletonLoader height="h-22" width="w-full" count={6} />
        ) : (
          statusTasks?.map((task) => <TaskItem task={task} key={task.id} />)
        )}
        {isColumnFormOpened && <AddTaskForm columnStatusId={id} />}
        <RowAddNew onClick={handleActiveColumnForm} label="Add Task" />
      </div>
    </div>
  );
}

export default memo(Column);
