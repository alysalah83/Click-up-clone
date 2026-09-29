import { memo } from "react";
import type { Task } from "@/features/task/types";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";
import TagChip from "./TagChip";

const MAX_TAGS = 3;

/** Board card badges: tags, subtask count and checklist progress. Renders nothing when empty. */
function TaskBadges({ task }: { task: Task }) {
  const tags = task.tags ?? [];
  const subtasks = task.subtaskCount ?? 0;
  const checklistTotal = task.checklistTotal ?? 0;
  const checklistDone = task.checklistDone ?? 0;
  if (tags.length === 0 && subtasks === 0 && checklistTotal === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
      {tags.slice(0, MAX_TAGS).map((tag) => (
        <TagChip key={tag.id} tag={tag} size="xs" />
      ))}
      {tags.length > MAX_TAGS && <span>+{tags.length - MAX_TAGS}</span>}
      {subtasks > 0 && (
        <span
          className="flex items-center gap-0.5"
          title={`${task.subtaskDoneCount ?? 0} of ${subtasks} subtasks done`}
        >
          <ICONS_MAP.rightArrow className="size-3" />
          {subtasks}
        </span>
      )}
      {checklistTotal > 0 && (
        <span
          className={cn(
            "flex items-center gap-0.5",
            checklistDone === checklistTotal &&
              "text-emerald-600 dark:text-emerald-400",
          )}
          title="Checklist items done"
        >
          <ICONS_MAP.complete className="size-3" />
          {checklistDone}/{checklistTotal}
        </span>
      )}
    </div>
  );
}

export default memo(TaskBadges);
