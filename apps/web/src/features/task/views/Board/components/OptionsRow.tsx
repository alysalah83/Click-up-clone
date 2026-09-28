import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import { memo } from "react";
import { ICON_SIZE } from "../board.const";
import OptionsContent from "../../../components/OptionsContent";
import { useTask } from "@/features/task/context/TaskProvider";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { STATUS_HIGHEST_ORDER } from "@/features/status/consts";
import { TaskOptionsButton } from "@/features/task/components/TaskDetailPanel";

function OptionsRow() {
  const { task, toggleIsRenameOpen } = useTask();
  const {
    id,
    status: { name: statusName },
  } = task;
  const { updateTask } = useUpdateTask();
  const { statuses } = useStatuses();

  const completeStatus = statuses?.find(
    (status) => status.order === STATUS_HIGHEST_ORDER,
  );

  return (
    <div
      className="absolute top-0.5 right-0.5 z-10 flex rounded-lg border border-neutral-300 bg-neutral-200 p-0.5 dark:border-neutral-700 dark:bg-neutral-900"
      onClick={(e) => e.stopPropagation()}
    >
      {statusName !== "complete" && (
        <ToolTip>
          <ToolTipTrigger>
            <ButtonIcon
              icon="checkMark"
              ariaLabel="task option menu"
              size={ICON_SIZE}
              onClick={() =>
                updateTask({
                  taskId: id,
                  updateTaskInput: { statusId: completeStatus?.id },
                })
              }
            />
          </ToolTipTrigger>
          <ToolTipMessage>Mark complete</ToolTipMessage>
        </ToolTip>
      )}
      <ToolTip>
        <ToolTipTrigger>
          <ButtonIcon
            icon="pen"
            ariaLabel="task rename"
            size={ICON_SIZE}
            onClick={toggleIsRenameOpen}
          />
        </ToolTipTrigger>
        <ToolTipMessage>Rename</ToolTipMessage>
      </ToolTip>

      <TaskOptionsButton task={task} buttonSize={ICON_SIZE} />

      <Menu>
        <MenuTrigger>
          <ToolTip>
            <ToolTipTrigger>
              <ButtonIcon
                icon="dotsRow"
                ariaLabel="task option menu"
                size={ICON_SIZE}
              />
            </ToolTipTrigger>
            <ToolTipMessage>More actions</ToolTipMessage>
          </ToolTip>
        </MenuTrigger>
        <MenuContent>
          <OptionsContent />
        </MenuContent>
      </Menu>
    </div>
  );
}

export default memo(OptionsRow);
