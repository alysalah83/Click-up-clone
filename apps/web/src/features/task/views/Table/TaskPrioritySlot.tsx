import { Menu, MenuTrigger, MenuContent } from "@/shared/ui/Menu/MenuCompound";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { memo } from "react";
import {
  slotBorderClasses,
  slotHoverClasses,
  slotPadding,
  iconsSize,
} from "./table.styles";
import { Task } from "../../types";
import { TASK_PRIORITIES_LIST } from "../../constants/tasks.const";
import PriorityUpdater from "../../components/PriorityUpdater";

function TaskPrioritySlot({ priority }: { priority: Task["priority"] }) {
  const curPriority = TASK_PRIORITIES_LIST.find(
    (item) => item.label.toLowerCase() === priority,
  );
  const Icon = ICONS_MAP.flag;

  return (
    <div
      className={`col-span-3 cursor-pointer ${slotBorderClasses} ${slotHoverClasses} `}
    >
      <Menu>
        <MenuTrigger>
          <div className={`flex items-center ${slotPadding} px-2`}>
            {curPriority ? (
              <div className="flex items-center gap-2">
                <Icon className={`${curPriority.iconColor} ${iconsSize}`} />
                <span>{curPriority.label}</span>
              </div>
            ) : (
              ""
            )}
          </div>
        </MenuTrigger>
        <MenuContent>
          <PriorityUpdater />
        </MenuContent>
      </Menu>
    </div>
  );
}

export default memo(TaskPrioritySlot);
