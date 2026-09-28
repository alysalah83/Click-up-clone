"use client";

import CheckBox from "@/shared/ui/CheckBox";
import { useCheckTask } from "../../context/CheckTaskProvider";
import {
  headerSlotHoverClasses,
  slotBorderClasses,
  containerGridClasses,
  slotPadding,
} from "./table.styles";
import SortRowField from "../../components/Sort/SortRowField";

function Header() {
  const { handleCheckAll, isAllChecked } = useCheckTask();

  if (isAllChecked === undefined) return;

  return (
    <header
      className={`${containerGridClasses} bg-neutral-100/80 text-sm font-semibold text-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-500`}
    >
      <div className="col-span-1 flex items-center justify-center border-r border-neutral-300 dark:border-neutral-700">
        <CheckBox checked={isAllChecked} onCheckedChange={handleCheckAll} />
      </div>
      <div
        className={`col-span-4 ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        Name
      </div>
      <div
        className={`col-span-3 flex items-center gap-2 ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        <span>Status</span>
        <SortRowField sortField="status" />
      </div>
      <div
        className={`col-span-3 flex items-center gap-2 ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        <span>Due date</span>
        <SortRowField sortField="dueDate" />
      </div>
      <div
        className={`col-span-3 flex items-center gap-2 ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        <span>Priority</span>
        <SortRowField sortField="priority" />
      </div>
      <div
        className={`col-span-5 flex items-center gap-2 ${slotPadding} ${headerSlotHoverClasses}`}
      >
        <span>Created at</span>
        <SortRowField sortField="createdAt" />
      </div>
    </header>
  );
}

export default Header;
