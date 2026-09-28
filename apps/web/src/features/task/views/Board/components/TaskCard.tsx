import FeatureBtns from "./FeatureBtns";
import { useDraggable } from "@dnd-kit/core";
import { useCallback, useMemo } from "react";
import {
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
} from "@/shared/ui/DropDown/DropdownCompound";
import { Task } from "@/features/task/types";
import { useTask } from "@/features/task/context/TaskProvider";
import TaskRenameForm from "@/features/task/components/TaskRenameForm";
import OptionsRow from "./OptionsRow";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { TASK_ICON_SIZE } from "@/features/task/constants/tasks.const";

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const { isRenameOpen, taskContainerRef, isTempTask } = useTask();
  const { name, id, status } = task;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: { status },
  });

  const setRefs = useCallback(
    (element: HTMLDivElement) => {
      taskContainerRef.current = element;
      setNodeRef(element);
    },
    [setNodeRef, taskContainerRef],
  );

  const styles = useMemo(
    () =>
      transform
        ? { transform: `transform3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined,
    [transform],
  );

  return (
    <Dropdown toggleOnChildClick={true}>
      <DropdownTrigger>
        <div
          ref={setRefs}
          {...listeners}
          {...attributes}
          style={styles}
          className={`${isTempTask ? "pointer-events-none opacity-75" : ""} group flex w-full cursor-pointer flex-col gap-3 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 transition duration-300 hover:border-neutral-100 active:border-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500 dark:active:border-neutral-500`}
        >
          {isRenameOpen ? (
            <TaskRenameForm />
          ) : (
            <div className="flex justify-between">
              <div className="flex items-center gap-1">
                <ICONS_MAP.dragHandle
                  className="size-3.5 cursor-grab text-neutral-500"
                  aria-label="drag handle"
                />
                <span className="line-clamp-2 grow-0 text-sm font-medium text-neutral-950 transition duration-300 dark:text-neutral-50 dark:group-hover:text-neutral-300 dark:group-active:text-neutral-300">
                  {name}
                </span>
              </div>

              <DropdownMenu>
                <OptionsRow />
              </DropdownMenu>
            </div>
          )}
          <div className="flex items-center gap-1">
            <FeatureBtns />
          </div>
        </div>
      </DropdownTrigger>
    </Dropdown>
  );
}

export default TaskCard;
