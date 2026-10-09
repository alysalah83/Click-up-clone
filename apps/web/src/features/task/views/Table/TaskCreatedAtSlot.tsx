import { slotPadding } from "./table.styles";
import { memo } from "react";
import { format } from "date-fns";
import { Task } from "../../types";
import { getformatDate } from "@/shared/lib/utils/getFormattedDate";

function TaskCreatedAtSlot({ createdAt }: { createdAt: Task["createdAt"] }) {
  return (
    <div
      className={`flex min-w-0 cursor-default items-center border-r border-neutral-300 text-neutral-400 tabular-nums dark:border-neutral-700 ${slotPadding}`}
    >
      <p suppressHydrationWarning className="truncate" title={getformatDate(createdAt)}>
        {format(new Date(createdAt), "MMM d, yyyy")}
      </p>
    </div>
  );
}

export default memo(TaskCreatedAtSlot);
