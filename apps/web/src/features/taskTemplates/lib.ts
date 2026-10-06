import type { TaskTemplate } from "./types";

/** Matches the template name, its description, its task name or its space. */
export function filterTemplates(templates: TaskTemplate[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter((t) =>
    [t.name, t.description, t.snapshot.name, t.workspace.name].some((field) => field.toLowerCase().includes(q)),
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "3 subtasks · 4 checklist items · due in 1 day" (only what the template includes). */
export function summaryParts(template: Pick<TaskTemplate, "snapshot">) {
  const subtasks = template.snapshot.subtasks.length;
  const checklistItems = template.snapshot.checklists.reduce((sum, c) => sum + c.items.length, 0);
  const parts: string[] = [];
  if (subtasks) parts.push(plural(subtasks, "subtask"));
  if (checklistItems) parts.push(plural(checklistItems, "checklist item"));
  const due = template.snapshot.dueInDays;
  if (due !== null) parts.push(due === 0 ? "due today" : `due in ${plural(due, "day")}`);
  return parts;
}
