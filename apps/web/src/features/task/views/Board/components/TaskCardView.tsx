import { ComponentPropsWithRef } from "react";
import FeatureBtns from "./FeatureBtns";
import {
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
} from "@/shared/ui/DropDown/DropdownCompound";
import { Task } from "@/features/task/types";
import { useTask } from "@/features/task/context/TaskProvider";
import TaskRenameForm from "@/features/task/components/TaskRenameForm";
import OptionsRow from "./OptionsRow";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";
import { AssigneesButton } from "@/features/members/components/AssigneePicker";

interface TaskCardViewProps extends Omit<ComponentPropsWithRef<"div">, "task"> {
  task: Task;
}

/**
 * Presentational board card. It renders the card's body only — no
 * `useDraggable`, so it is safe to render a second, non-interactive copy of
 * it inside a `DragOverlay` while the "real" card (the draggable wrapper,
 * `TaskCard`) stays put underneath.
 */
function TaskCardView({ task, className, ...rest }: TaskCardViewProps) {
  const { isRenameOpen, isTempTask } = useTask();
  const { name } = task;

  return (
    <Dropdown toggleOnChildClick={true}>
      <DropdownTrigger>
        <div
          className={cn(
            "group flex w-full cursor-pointer flex-col gap-3 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 transition duration-300 hover:border-neutral-100 active:border-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500 dark:active:border-neutral-500",
            isTempTask && "pointer-events-none opacity-75",
            className,
          )}
          {...rest}
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
            <span className="ml-auto">
              <AssigneesButton task={task} size="xs" />
            </span>
          </div>
        </div>
      </DropdownTrigger>
    </Dropdown>
  );
}

export default TaskCardView;
