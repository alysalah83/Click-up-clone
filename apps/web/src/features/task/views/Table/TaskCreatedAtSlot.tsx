import { slotPadding } from "./table.styles";
import { memo } from "react";
import { Task } from "../../types";
import { getformatDate } from "@/shared/lib/utils/getFormattedDate";

function TaskCreatedAtSlot({ createdAt }: { createdAt: Task["createdAt"] }) {
  return (
    <div
      className={`col-span-5 flex cursor-default items-center text-neutral-400 tabular-nums ${slotPadding}`}
    >
      <p suppressHydrationWarning>{getformatDate(createdAt)}</p>
    </div>
  );
}

export default memo(TaskCreatedAtSlot);
