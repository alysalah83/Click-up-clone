import { useDraggable } from "@dnd-kit/core";
import { useCallback, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Task } from "@/features/task/types";
import { useTask } from "@/features/task/context/TaskProvider";
import { TaskDetailPanel } from "@/features/task/components/TaskDetailPanel";
import Modal, { ModalContent } from "@/shared/ui/ModalCompound";
import TaskCardView from "./TaskCardView";

interface TaskCardProps {
  task: Task;
}

// Clicks on these, or inside a portaled menu/dialog, must not open the
// detail panel.
const NO_CARD_CLICK_SELECTOR =
  'button, a, input, textarea, select, [role="menu"], [role="dialog"], [data-no-card-click]';

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

  const canOpenDetail = () => !isRenameOpen && !isTempTask;

  // Portaled content (Menu popovers, the Modal itself) is rendered outside
  // this card's DOM subtree, but React re-dispatches its synthetic events
  // through the React tree the portal was mounted from — which bubbles them
  // to this onClick. `closest()` alone only catches elements still inside
  // the card's actual DOM; the containment check below also catches those
  // portal-originated bubbled clicks.
  const isClickInsideCard = (e: MouseEvent<HTMLDivElement>) =>
    e.currentTarget.contains(e.target as Node);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!canOpenDetail()) return;
    const target = e.target as Element;
    if (target.closest(NO_CARD_CLICK_SELECTOR)) return;
    if (!isClickInsideCard(e)) return;
    setIsDetailOpen(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenDetail()) return;
    if (e.target !== e.currentTarget) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    setIsDetailOpen(true);
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
