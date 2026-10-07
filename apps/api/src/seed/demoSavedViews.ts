import { randomUUID } from "node:crypto";
import type { SavedViewConfig } from "@clickup/shared";

/** Example views on the landing list (one with board swimlanes); none is the default, so the demo opens unfiltered. */
export function buildDemoSavedViews(userId: string, listId: string) {
  const config: SavedViewConfig = {
    filters: { assignees: [], statuses: [], priorities: ["urgent", "high"], tags: [], due: { kind: "week" }, custom: [] },
    groupBy: "assignee",
    swimlanes: "none",
    sort: null,
  };
  const byAssignee: SavedViewConfig = {
    filters: { assignees: [], statuses: [], priorities: [], tags: [], due: null, custom: [] },
    groupBy: "status",
    swimlanes: "assignee",
    sort: null,
  };
  return [
    { id: randomUUID(), listId, userId, name: "Urgent this week, by person", config, isDefault: false },
    { id: randomUUID(), listId, userId, name: "By assignee", config: byAssignee, isDefault: false },
  ];
}
