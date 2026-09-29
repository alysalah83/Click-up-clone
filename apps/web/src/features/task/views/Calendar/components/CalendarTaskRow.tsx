"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { Task } from "@/features/task/types";
import { useDraggable } from "@dnd-kit/core";
import { TaskDetailPanel } from "@/features/task/components/TaskDetailPanel";
import Modal, { ModalContent } from "@/shared/ui/ModalCompound";
import { shouldOpenTaskDetail } from "@/features/task/lib/shouldOpenTaskDetail";
import CalendarTaskRowView from "./CalendarTaskRowView";

interface CalendarTaskRowProps {
  task: Task;
  cellDate: Date;
}

function CalendarTaskRow({ task, cellDate }: CalendarTaskRowProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${task.id}-${cellDate.toISOString()}`,
    data: { task, cellDate },
  });

  // Only the drag handle carries the drag listeners, so a click anywhere else
  // on the row opens the task details (same path as a board card click).
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (
      shouldOpenTaskDetail({
        target: e.target as Element,
        currentTarget: e.currentTarget,
        isRenameOpen: false,
        isTempTask: false,
      })
    )
      setIsDetailOpen(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (
      shouldOpenTaskDetail({
        target: e.target as Element,
        currentTarget: e.currentTarget,
        isRenameOpen: false,
        isTempTask: false,
        key: e.key,
      })
    ) {
      e.preventDefault();
      setIsDetailOpen(true);
    }
  };

  return (
    <>
      <CalendarTaskRowView
        task={task}
        cellDate={cellDate}
        ref={setNodeRef}
        className={`cursor-pointer ${isDragging ? "opacity-40" : ""}`}
        dragHandleProps={listeners}
        {...attributes}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      />
      <Modal open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <ModalContent contentYPosition="withTopMargin" title="Task details">
          <TaskDetailPanel task={task} />
        </ModalContent>
      </Modal>
    </>
  );
}

export default CalendarTaskRow;
