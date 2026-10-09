"use client";

import CheckBox from "@/shared/ui/CheckBox";
import { useCheckTask } from "../../context/CheckTaskProvider";
import {
  headerSlotHoverClasses,
  slotBorderClasses,
  containerGridClasses,
  slotPadding,
  stickyCheckClasses,
  stickyNameClasses,
} from "./table.styles";
import SortRowField from "../../components/Sort/SortRowField";
import { useCustomFields } from "@/features/customFields/hooks";
import { AddFieldButton, FieldHeader } from "@/features/customFields/components/FieldHeader";
import useTasks from "../../hooks/useTasks";
import { useTasksQueryKey } from "../../hooks/useTasksQueryKey";

function Header() {
  const { handleCheckAll, isAllChecked } = useCheckTask();
  const { listId } = useTasksQueryKey();
  const { fields = [] } = useCustomFields(listId);
  const { tasks } = useTasks();
  const sampleTask = tasks?.find((t) => t.points != null) ?? tasks?.[0];

  if (isAllChecked === undefined) return;

  return (
    <header
      className={`${containerGridClasses} bg-neutral-100 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:bg-neutral-900 dark:text-neutral-500`}
    >
      <div className={`${stickyCheckClasses} flex items-center justify-center border-r border-neutral-300 dark:border-neutral-700`}>
        <CheckBox checked={isAllChecked} onCheckedChange={handleCheckAll} />
      </div>
      <div
        className={`${stickyNameClasses} flex items-center ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        Name
      </div>
      <div className={`flex items-center ${slotBorderClasses} ${slotPadding}`}>
        Assignee
      </div>
      <div
        className={`flex items-center gap-2 whitespace-nowrap ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        <span>Status</span>
        <SortRowField sortField="status" />
      </div>
      <div
        className={`flex items-center gap-2 whitespace-nowrap ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        <span>Due date</span>
        <SortRowField sortField="dueDate" />
      </div>
      <div
        className={`flex items-center gap-2 whitespace-nowrap ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        <span>Priority</span>
        <SortRowField sortField="priority" />
      </div>
      <div className={`flex items-center ${slotBorderClasses} ${slotPadding}`} title="Sprint points">
        Points
      </div>
      <div
        className={`flex items-center gap-2 whitespace-nowrap ${slotBorderClasses} ${slotPadding} ${headerSlotHoverClasses}`}
      >
        <span>Created at</span>
        <SortRowField sortField="createdAt" />
      </div>
      {fields.map((field) => (
        <div key={field.id} className={`min-w-0 ${slotBorderClasses} ${headerSlotHoverClasses}`}>
          <FieldHeader field={field} fields={fields} listId={listId} sampleTask={sampleTask} />
        </div>
      ))}
      <div className="flex items-center justify-center">
        <AddFieldButton listId={listId} fields={fields} sampleTask={sampleTask} className="size-7" />
      </div>
    </header>
  );
}

export default Header;
