import { slotPadding } from "./table.styles";
import { memo } from "react";
import { Task } from "../../types";
import { getformatDate } from "@/shared/lib/utils/getFormattedDate";

function TaskCreatedAtSlot({ createdAt }: { createdAt: Task["createdAt"] }) {
  return (
    <div
      className={`col-span-3 flex truncate cursor-default items-center border-r border-neutral-300 text-neutral-400 tabular-nums dark:border-neutral-700 ${slotPadding}`}
    >
      <p suppressHydrationWarning>{getformatDate(createdAt)}</p>
    </div>
  );
}

export default memo(TaskCreatedAtSlot);
