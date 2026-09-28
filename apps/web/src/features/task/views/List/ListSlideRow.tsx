import { ICONS_MAP } from "@/shared/icons/icons-map";
import { useTask } from "../../context/TaskProvider";
import { TASK_PRIORITIES_LIST } from "../../constants/tasks.const";
import {
  listBgHoverGradient,
  listRowBorder,
  listSlotHover,
} from "./list.styles";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import DateUpdater from "../../components/DateUpdater";
import { getFormattedRangeDate } from "@/shared/lib/utils/getFormattedRangeDate";
import PriorityUpdater from "../../components/PriorityUpdater";
import StatusBadge from "../../../status/components/StatusBadge";
import StatusUpdater from "../../../status/components/StatusUpdaterMenu/StatusUpdater";
import { ICONS_REGISTRY } from "@/shared/ui/IconPicker/IconRegistry";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";

function ListSlideRow() {
  const {
    task: {
      name,
      status: { icon, iconColor },
    },
    isTempTask,
  } = useTask();

  const Icon = ICONS_REGISTRY[icon as IconsRegistry];
  const iconColorClass = COLORS_TOKENS[iconColor as ColorsToken];

  return (
    <div
      className={`grid grid-cols-21 ${listRowBorder} ${isTempTask ? "pointer-events-none opacity-60" : ""} text-base font-medium text-neutral-300 ${listBgHoverGradient}`}
    >
      <div className="col-span-10 flex items-center gap-2 p-2">
        <Icon className={`${iconColorClass} size-4 shrink-0`} />
        <span className="line-clamp-1 truncate">{name}</span>
      </div>
      <ListSlotDueDate />
      <ListSlotPriority />
      <ListSlotStatus />
    </div>
  );
}

function ListSlotDueDate() {
  const {
    task: { startDate, endDate },
  } = useTask();
  const isHaveDate = !!startDate && !!endDate;

  return (
    <div className={`col-span-3 p-2 ${listSlotHover}`}>
      <Menu>
        <MenuTrigger>
          {!isHaveDate ? (
            <ICONS_MAP.date className="size-4 fill-neutral-600" />
          ) : (
            <span className="line-clamp-1 truncate">
              {getFormattedRangeDate({ startDate, endDate })}
            </span>
          )}
        </MenuTrigger>
        <MenuContent>
          <DateUpdater />
        </MenuContent>
      </Menu>
    </div>
  );
}

function ListSlotPriority() {
  const {
    task: { priority },
  } = useTask();

  const curPriority = TASK_PRIORITIES_LIST.find(
    (item) => item.label.toLowerCase() === priority,
  );
  const Icon = ICONS_MAP.flag;

  const isHavePriority = priority !== "none" && curPriority;

  return (
    <div className={`col-span-3 p-2 ${listSlotHover}`}>
      <Menu>
        <MenuTrigger>
          {isHavePriority ? (
            <div className="flex items-center gap-2">
              <Icon className={`${curPriority.iconColor} size-4`} />
              <span>{curPriority.label}</span>
            </div>
          ) : (
            <Icon className="size-4 fill-neutral-600" />
          )}
        </MenuTrigger>
        <MenuContent>
          <PriorityUpdater />
        </MenuContent>
      </Menu>
    </div>
  );
}

function ListSlotStatus() {
  const {
    task: {
      status: { name, icon, bgColor },
    },
  } = useTask();

  return (
    <div className={`col-span-3 p-2 ${listSlotHover}`}>
      <Menu>
        <MenuTrigger>
          <StatusBadge
            status={name}
            icon={icon}
            bgColor={bgColor}
            size="small"
          />
        </MenuTrigger>
        <MenuContent>
          <StatusUpdater />
        </MenuContent>
      </Menu>
    </div>
  );
}

export default ListSlideRow;
