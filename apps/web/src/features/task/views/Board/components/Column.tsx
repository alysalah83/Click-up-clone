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
import { useViewTasks } from "@/features/viewConfig/hooks/useViewTasks";
import TaskItem from "./TaskItem";
import ColumnFeaturesBtn from "./ColumnFeaturesBtn";
import WipCount from "./WipCount";
import { wipState } from "../lib/swimlanes";

interface ColumnProps {
  statusItem: Status;
}

function Column({ statusItem }: ColumnProps) {
  const { id, icon, name: statusName, bgColor, isDefault } = statusItem;
  const { tasks, allTasks, isPending } = useViewTasks();
  const { activeStatusColumn, setActiveColumn } = useActiveColumnForm();
  const { isOver, setNodeRef } = useDroppable({ id, data: { statusId: id } });

  const isTempStatus = id.includes("temp");
  const isColumnFormOpened = activeStatusColumn === statusName;
  const statusTasks = tasks?.filter((task) => task.statusId === id);
  const tasksCount = statusTasks?.length;
  // WIP limits count every task in the column, whatever the filters hide.
  const wipCount = statusItem.wipLimit ? allTasks?.filter((task) => task.statusId === id).length : tasksCount;
  const wipExceeded = wipState(wipCount ?? 0, statusItem.wipLimit) === "exceeded";

  const handleActiveColumnForm = () => setActiveColumn(statusName);

  const cardBgColorClass =
    BOARD_STATUS_BACKGROUND_COLOR[bgColor as ColorsToken];

  return (
    <div
      ref={setNodeRef}
      className={`flex h-fit max-h-full w-2xs shrink-0 snap-start flex-col gap-1 overflow-y-auto rounded-xl px-1.5 pt-2.5 pb-1.5 ${isTempStatus ? "pointer-events-none opacity-75" : ""} ${cardBgColorClass} ${isOver ? "ring-2 ring-neutral-300 outline-0 dark:ring-neutral-700" : wipExceeded ? "ring-2 ring-red-400/70 dark:ring-red-500/60" : ""} transition-all duration-200`}
    >
      <header className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <StatusBadge status={statusName} icon={icon} bgColor={bgColor} />
          <WipCount count={wipCount} limit={statusItem.wipLimit} />
        </div>
        <ColumnFeaturesBtn
          handleActiveColumn={handleActiveColumnForm}
          isDefault={isDefault}
          statusId={id}
          statusName={statusName}
          status={isTempStatus ? undefined : statusItem}
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
