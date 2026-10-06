import { useDraggable } from "@dnd-kit/core";
import { useCallback, type KeyboardEvent, type MouseEvent } from "react";
import { Task } from "@/features/task/types";
import { useTask } from "@/features/task/context/TaskProvider";
import { useOpenTask } from "@/features/taskDetail/hooks/useTaskParam";
import { shouldOpenTaskDetail } from "@/features/task/lib/shouldOpenTaskDetail";
import TaskCardView from "./TaskCardView";
import { laneCardId } from "../lib/swimlanes";

interface TaskCardProps {
  task: Task;
  /** Swimlane the card is rendered in; a task with several assignees has one card per lane. */
  laneKey?: string;
}

function TaskCard({ task, laneKey }: TaskCardProps) {
  const { isRenameOpen, taskContainerRef, isTempTask } = useTask();
  const { id, statusId } = task;
  const openTask = useOpenTask();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: laneKey === undefined ? id : laneCardId(id, laneKey),
    data: { statusId, laneKey, taskId: id },
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
      openTask(id);
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
      openTask(id);
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
    </>
  );
}

export default TaskCard;
