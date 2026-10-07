import { format } from "date-fns";
import { formatDuration } from "./duration";
import type { ActivityEntry } from "../types";

/** A sentence part; `strong` parts are rendered bold. */
export type SentencePart = { text: string; strong?: boolean };

const strong = (text: string | null | undefined): SentencePart => ({
  text: text || "none",
  strong: true,
});
const plain = (text: string): SentencePart => ({ text });
const capitalize = (value: string | null | undefined) =>
  value ? value[0]!.toUpperCase() + value.slice(1) : "none";
const day = (iso: string | null | undefined) =>
  iso ? format(new Date(iso), "MMM d") : null;

/** "changed status from To Do to In Progress" (without the actor's name). */
export function activitySentence({
  type,
  data,
}: ActivityEntry): SentencePart[] {
  switch (type) {
    case "created":
      return [plain("created this task")];
    case "status":
      return [
        plain("changed status from "),
        strong(capitalize(data.from)),
        plain(" to "),
        strong(capitalize(data.to)),
      ];
    case "priority":
      return [
        plain("changed priority from "),
        strong(capitalize(data.from)),
        plain(" to "),
        strong(capitalize(data.to)),
      ];
    case "dates": {
      const start = day(data.startDate);
      const end = day(data.endDate);
      if (!start && !end) return [plain("removed the dates")];
      if (start && end && start !== end)
        return [plain("set the dates to "), strong(`${start} → ${end}`)];
      return [plain("set the due date to "), strong(end ?? start)];
    }
    case "renamed":
      return [plain("renamed this task to "), strong(data.to)];
    case "assignee_added":
      return [plain("assigned "), strong(data.name)];
    case "assignee_removed":
      return [plain("unassigned "), strong(data.name)];
    case "description":
      return [plain("updated the description")];
    case "subtask_added":
      return [plain("added subtask "), strong(data.name)];
    case "checklist_item_done":
      return [plain("completed "), strong(data.text)];
    case "tag_added":
      return [plain("added tag "), strong(data.name)];
    case "automation":
      return [
        plain("ran automation "),
        strong(data.name),
        plain(` (${data.summary ?? "done"})`),
      ];
    case "recurred":
      return [plain("completed this task and scheduled the next occurrence")];
    case "time_logged":
      return [plain("tracked "), strong(formatDuration(Number(data.durationSec ?? 0)))];
    case "points":
      if (!data.to) return [plain("removed the sprint points")];
      if (!data.from) return [plain("set sprint points to "), strong(data.to)];
      return [plain("changed sprint points from "), strong(data.from), plain(" to "), strong(data.to)];
    case "sprint_carried":
      return [plain("carried this task over from "), strong(data.from), plain(" to "), strong(data.to)];
    case "attachment_added":
      return [plain("attached "), strong(data.name)];
    case "created_from_template":
      return [plain("created this task from template "), strong(data.name)];
    case "submitted_via_form":
      return [plain("submitted via form "), strong(data.name)];
    case "custom_field": {
      if (data.fieldType === "checkbox") return [plain(data.to ? "checked " : "unchecked "), strong(data.field)];
      if (!data.to) return [plain("cleared "), strong(data.field)];
      const to = data.fieldType === "date" ? format(new Date(`${data.to}T12:00:00`), "MMM d") : data.to;
      return [plain("set "), strong(data.field), plain(" to "), strong(to)];
    }
    default:
      return [plain("updated this task")];
  }
}
