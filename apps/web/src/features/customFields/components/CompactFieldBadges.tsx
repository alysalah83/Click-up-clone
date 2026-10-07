"use client";

import type { Task } from "@/features/task/types";
import { useCustomFields } from "../hooks";
import { OptionPill } from "./ValueEditor";

/** The task's dropdown field values as small pills (List view rows), e.g. its Severity. */
function CompactFieldBadges({ task }: { task: Pick<Task, "listId" | "customFields"> }) {
  const { fields } = useCustomFields(task.listId);
  const pills = (fields ?? []).flatMap((field) => {
    if (field.type !== "dropdown") return [];
    const option = field.config.options?.find((o) => o.id === task.customFields?.[field.id]);
    return option ? [{ field, option }] : [];
  });
  if (!pills.length) return null;
  return (
    <span className="flex shrink-0 items-center gap-1">
      {pills.slice(0, 2).map(({ field, option }) => (
        <span key={field.id} title={`${field.name}: ${option.name}`}>
          <OptionPill option={option} className="px-1 py-0 text-[10px]" />
        </span>
      ))}
    </span>
  );
}

export default CompactFieldBadges;
