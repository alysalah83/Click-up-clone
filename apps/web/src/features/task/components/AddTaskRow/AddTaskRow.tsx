"use client";

import { useState } from "react";
import OpenedAddTaskRow from "./OpenedAddTaskRow";
import ClosedAddTaskRow from "./ClosedAddTaskRow";
import { containerGridClasses } from "../../views/Table/table.styles";
import { Task } from "@/features/task/types";
import clsx from "clsx";
import { StyleFor } from "./type";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { STATUS_LOWEST_ORDER } from "@/features/status/consts";

interface AddTaskRowProps {
  styleFor: StyleFor;
  statusId?: Task["statusId"];
}

function AddTaskRow({ statusId, styleFor }: AddTaskRowProps) {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { statuses } = useStatuses();
  const toDoStatus = statuses?.find(
    (status) => status.order === STATUS_LOWEST_ORDER,
  );

  const curStatusId = styleFor === "table" ? toDoStatus?.id : statusId;

  const handleToggleAddTaskOpen = () => setIsAddTaskOpen((cur) => !cur);
  const handleCloseAddTask = () => setIsAddTaskOpen(false);

  const containerClasses = clsx(
    "py-1 text-sm text-neutral-500 transition duration-300 font-medium dark:text-neutral-300",
    {
      "border-b border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-200 dark:bg-neutral-900/50 dark:hover:bg-neutral-500/20 dark:active:bg-neutral-500/20":
        styleFor === "table",
      "hover:bg-neutral-200 active:bg-neutral-200 dark:hover:bg-neutral-500/20 dark:active:bg-neutral-500/20":
        !isAddTaskOpen && styleFor === "list",

      [containerGridClasses]: styleFor === "table",
      "grid grid-cols-10": styleFor === "list",
      "cursor-pointer": !isAddTaskOpen,
    },
  );

  return (
    <div
      onClick={() => {
        if (!isAddTaskOpen) handleToggleAddTaskOpen();
      }}
      className={containerClasses}
    >
      {isAddTaskOpen ? (
        <OpenedAddTaskRow
          styleFor={styleFor}
          statusId={curStatusId!}
          onClose={handleCloseAddTask}
        />
      ) : (
        <ClosedAddTaskRow styleFor={styleFor} />
      )}
    </div>
  );
}

export default AddTaskRow;
