import { CalendarClock, CheckSquare, Flag, ListTree } from "lucide-react";
import TagChip from "@/features/taskDetail/components/TagChip";
import { TASK_PRIORITIES_LIST } from "@/features/task/constants/tasks.const";
import { summaryParts } from "../lib";
import type { TaskTemplate } from "../types";

/** What a template creates: priority, tags, subtasks and checklists. */
function TemplatePreview({ template }: { template: TaskTemplate }) {
  const { snapshot } = template;
  const priority = TASK_PRIORITIES_LIST.find((p) => p.label.toLowerCase() === snapshot.priority);
  const parts = summaryParts(template);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <h3 className="text-base font-semibold">{template.name}</h3>
        <p className="text-xs text-muted-foreground">
          {template.workspace.name}
          {parts.length > 0 && ` · ${parts.join(" · ")}`}
        </p>
        {template.description && <p className="mt-2 text-muted-foreground">{template.description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {priority && (
          <span className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-0.5 text-xs dark:border-neutral-700">
            <Flag aria-hidden className="size-3.5" style={{ color: priority.colorHex, fill: priority.colorHex }} />
            {priority.label}
          </span>
        )}
        {snapshot.points !== null && (
          <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs dark:border-neutral-700">
            {snapshot.points} pts
          </span>
        )}
        {snapshot.dueInDays !== null && (
          <span className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-0.5 text-xs dark:border-neutral-700">
            <CalendarClock aria-hidden className="size-3.5" />
            {snapshot.dueInDays === 0 ? "Due today" : `Due in ${snapshot.dueInDays}d`}
          </span>
        )}
        {snapshot.tags.map((tag) => (
          <TagChip key={tag.name} tag={tag} size="xs" />
        ))}
      </div>

      {snapshot.subtasks.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ListTree aria-hidden className="size-3.5" /> Subtasks
          </h4>
          <ul className="flex flex-col gap-1">
            {snapshot.subtasks.map((s, i) => (
              <li
                key={i}
                className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs dark:border-neutral-800"
              >
                {s.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {snapshot.checklists.map((checklist, i) => (
        <section key={i} className="flex flex-col gap-1.5">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CheckSquare aria-hidden className="size-3.5" /> {checklist.name}
            <span className="font-normal">({checklist.items.length})</span>
          </h4>
          <ul className="flex flex-col gap-1 pl-1">
            {checklist.items.map((item, j) => (
              <li key={j} className="flex items-center gap-2 text-xs">
                <span aria-hidden className="size-3 shrink-0 rounded-sm border border-neutral-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default TemplatePreview;
