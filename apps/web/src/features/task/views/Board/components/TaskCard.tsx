import { useDraggable } from "@dnd-kit/core";
import { useCallback, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Task } from "@/features/task/types";
import { useTask } from "@/features/task/context/TaskProvider";
import { TaskDetailPanel } from "@/features/task/components/TaskDetailPanel";
import Modal, { ModalContent } from "@/shared/ui/ModalCompound";
import { shouldOpenTaskDetail } from "@/features/task/lib/shouldOpenTaskDetail";
import TaskCardView from "./TaskCardView";

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const { isRenameOpen, taskContainerRef, isTempTask } = useTask();
  const { id, statusId } = task;
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { statusId },
  });

  const setRefs = useCallback(
    (element: HTMLDivElement) => {
      taskContainerRef.current = element;
      setNodeRef(element);
    },
    [setNodeRef, taskContainerRef],
  );

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (
      shouldOpenTaskDetail({
        target: e.target as Element,
        currentTarget: e.currentTarget,
        isRenameOpen,
        isTempTask,
      })
    ) {
      setIsDetailOpen(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (
      shouldOpenTaskDetail({
        target: e.target as Element,
        currentTarget: e.currentTarget,
        isRenameOpen,
        isTempTask,
        key: e.key,
      })
    ) {
      e.preventDefault();
      setIsDetailOpen(true);
    }
  };

  return (
    <>
      <TaskCardView
        task={task}
        ref={setRefs}
        className={isDragging ? "opacity-40" : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...listeners}
        {...attributes}
        role="button"
        tabIndex={0}
      />
      <Modal open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <ModalContent contentYPosition="withTopMargin" title="Task details">
          <TaskDetailPanel task={task} />
        </ModalContent>
      </Modal>
    </>
  );
}

export default TaskCard;
