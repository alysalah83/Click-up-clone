import { ICONS_MAP } from "@/shared/icons/icons-map";
import { memo } from "react";
import {
  iconsSize,
  slotBorderClasses,
  slotHoverClasses,
  slotPadding,
} from "./table.styles";
import TaskRenameForm from "@/shared/components/RenameForm";
import { useTask } from "../../context/TaskProvider";
import { useUpdateTask } from "../../hooks/useUpdateTask";
import { ICONS_REGISTRY } from "@/shared/ui/IconPicker/IconRegistry";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";

function TaskNameSlot() {
  const {
    toggleIsRenameOpen,
    isRenameOpen,
    task: { id, name, status },
    isTempTask,
  } = useTask();
  const { updateTask } = useUpdateTask();

  const handleUpdateName = function (name: string) {
    updateTask({ taskId: id, updateTaskInput: { name } });
    toggleIsRenameOpen();
  };

  const Icon = ICONS_REGISTRY[status?.icon as IconsRegistry];
  const iconColor = COLORS_TOKENS[status?.iconColor as ColorsToken]?.icon;

  return (
    <div
      className={`col-span-4 flex cursor-default items-center ${slotHoverClasses} ${slotBorderClasses} ${slotPadding}`}
      onClick={() => {
        if (!isRenameOpen) toggleIsRenameOpen();
      }}
    >
      {isRenameOpen ? (
        <TaskRenameForm
          onSave={handleUpdateName}
          onClose={(e) => {
            e?.stopPropagation();
            toggleIsRenameOpen();
          }}
          initialName={name}
        />
      ) : (
        <div className={`flex w-full items-center gap-1.5`}>
          <Icon className={`${iconColor} ${iconsSize} shrink-0`} />
          <span className="line-clamp-1 truncate">{name}</span>
        </div>
      )}
    </div>
  );
}

export default memo(TaskNameSlot);
