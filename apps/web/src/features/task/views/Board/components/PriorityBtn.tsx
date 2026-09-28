import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import { useTask } from "../../../context/TaskProvider";
import { ICON_SIZE } from "../board.const";
import { IconsMap } from "@/shared/icons/icons.type";
import { TASK_PRIORITIES_LIST } from "@/features/task/constants/tasks.const";
import PriorityUpdater from "@/features/task/components/PriorityUpdater";

function PriorityBtn({ label, icon }: { label: string; icon: IconsMap }) {
  const {
    task: { priority },
  } = useTask();

  const priorityLabel = priority?.replace(
    priority[0]!,
    priority[0]!?.toUpperCase(),
  );
  const getIconColor = TASK_PRIORITIES_LIST.find(
    (item) => item.label === priorityLabel,
  )?.iconColor;

  return (
    <span>
      <Menu>
        <MenuTrigger>
          <ToolTip>
            <ToolTipMessage>{label}</ToolTipMessage>
            <ToolTipTrigger>
              {priority === "none" ? (
                <ButtonIcon
                  icon={icon}
                  ariaLabel={`${label} button`}
                  withBg={true}
                  size={ICON_SIZE}
                />
              ) : (
                <ButtonIcon
                  icon={icon}
                  iconColor={getIconColor}
                  label={priorityLabel}
                  ariaLabel={`${label} button`}
                  withBg={true}
                  padding="small"
                  size={ICON_SIZE}
                />
              )}
            </ToolTipTrigger>
          </ToolTip>
        </MenuTrigger>
        <MenuContent>
          <PriorityUpdater />
        </MenuContent>
      </Menu>
    </span>
  );
}

export default PriorityBtn;
