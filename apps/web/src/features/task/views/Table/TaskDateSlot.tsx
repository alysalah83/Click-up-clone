import { memo } from "react";
import {
  slotBorderClasses,
  slotHoverClasses,
  slotPadding,
} from "./table.styles";
import { Menu, MenuTrigger, MenuContent } from "@/shared/ui/Menu/MenuCompound";
import { Task } from "../../types";
import { getFormattedRangeDate } from "@/shared/lib/utils/getFormattedRangeDate";
import DateUpdater from "../../components/DateUpdater";

interface TaskDateSlotProps {
  startDate: Task["startDate"];
  endDate: Task["endDate"];
}

function TaskDateSlot({ endDate, startDate }: TaskDateSlotProps) {
  return (
    <div
      className={`cursor-pointer ${slotHoverClasses} ${slotBorderClasses}`}
    >
      <Menu>
        <MenuTrigger containerClasses="h-full">
          <div className={`flex h-full items-center ${slotPadding}`}>
            <span className="font-semibold whitespace-nowrap tabular-nums">
              {getFormattedRangeDate({ startDate, endDate })}
            </span>
          </div>
        </MenuTrigger>
        <MenuContent>
          <DateUpdater />
        </MenuContent>
      </Menu>
    </div>
  );
}

export default memo(TaskDateSlot);
