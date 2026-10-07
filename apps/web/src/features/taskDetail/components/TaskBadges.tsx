import { memo } from "react";
import { Paperclip, Repeat } from "lucide-react";
import type { Task } from "@/features/task/types";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";
import TagChip from "./TagChip";
import { PointsBadge } from "@/features/sprint/components/PointsPicker";
import CompactFieldBadges from "@/features/customFields/components/CompactFieldBadges";

const MAX_TAGS = 3;

/** Board card badges: sprint points, dropdown custom fields (e.g. Severity), tags, subtask count, attachments and checklist progress. Renders nothing when empty. */
function TaskBadges({ task }: { task: Task }) {
  const tags = task.tags ?? [];
  const subtasks = task.subtaskCount ?? 0;
  const checklistTotal = task.checklistTotal ?? 0;
  const checklistDone = task.checklistDone ?? 0;
  const repeats = !!task.recurrenceType && task.recurrenceType !== "none";
  const points = task.points ?? null;
  const attachments = task.attachmentCount ?? 0;
  const hasFields = Object.keys(task.customFields ?? {}).length > 0;
  if (tags.length === 0 && subtasks === 0 && checklistTotal === 0 && !repeats && points === null && attachments === 0 && !hasFields)
    return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
      {points !== null && <PointsBadge points={points} />}
      {hasFields && <CompactFieldBadges task={task} />}
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
      {repeats && (
        <span className="flex items-center" title="Repeating task" aria-label="repeating task">
          <Repeat className="size-3" />
        </span>
      )}
      {attachments > 0 && (
        <span
          className="flex items-center gap-0.5"
          title={`${attachments} attachment${attachments === 1 ? "" : "s"}`}
          aria-label={`${attachments} attachments`}
        >
          <Paperclip className="size-3" />
          {attachments}
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
