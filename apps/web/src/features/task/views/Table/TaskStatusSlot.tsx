import {
  slotBorderClasses,
  slotHoverClasses,
  slotPadding,
} from "./table.styles";
import { memo } from "react";
import StatusUpdaterMenu from "@/features/status/components/StatusUpdaterMenu/StatusUpdaterMenu";
import { Task } from "../../types";

function TaskStatusSlot({ status }: { status: Task["status"] }) {
  return (
    <div
      className={`col-span-3 flex items-center ${slotBorderClasses} ${slotHoverClasses} ${slotPadding}`}
    >
      <StatusUpdaterMenu curStatus={status} statusBadgeSize="small" />
    </div>
  );
}

export default memo(TaskStatusSlot);
