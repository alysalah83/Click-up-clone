import PriorityMenu from "@/features/task/components/PriorityMenu";
import { TASK_PRIORITIES_LIST } from "@/features/task/constants/tasks.const";
import { Task, TaskDateRange } from "@/features/task/types";
import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import DateRangePicker from "@/shared/ui/DateRangePicker";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { getFormattedRangeDate } from "@/shared/lib/utils/getFormattedRangeDate";
import { ICON_SIZE } from "./consts";

interface AddTaskFeatureBtnsProps {
  priority: Task["priority"];
  dateRange: TaskDateRange;
  onPriorityChange: (priority: Task["priority"]) => void;
  onDateChange: (dateRange: TaskDateRange) => void;
}

function AddTaskFeatureBtns({
  priority,
  dateRange,
  onPriorityChange,
  onDateChange,
}: AddTaskFeatureBtnsProps) {
  const priorityObj =
    priority !== "none" &&
    TASK_PRIORITIES_LIST.find(
      (item) => item.label.toLocaleLowerCase() === priority,
    );

  return (
    <div className="flex gap-1">
      <Menu>
        <MenuTrigger>
          <ButtonIcon
            type="bordered"
            label={
              dateRange.startDate && dateRange.endDate
                ? getFormattedRangeDate(dateRange)
                : ""
            }
            size={ICON_SIZE}
            ariaLabel="open date menu button"
            icon="date"
          />
        </MenuTrigger>
        <MenuContent>
          <DateRangePicker dateRanges={dateRange} onDateChange={onDateChange} />
        </MenuContent>
      </Menu>
      <Menu>
        <MenuTrigger>
          <ButtonIcon
            type="bordered"
            size={ICON_SIZE}
            label={priorityObj ? priorityObj.label : ""}
            iconColor={priorityObj ? priorityObj.iconColor : ""}
            ariaLabel="open priority menu button"
            icon="flag"
          />
        </MenuTrigger>
        <MenuContent>
          <PriorityMenu action={onPriorityChange} />
        </MenuContent>
      </Menu>
    </div>
  );
}

export default AddTaskFeatureBtns;
