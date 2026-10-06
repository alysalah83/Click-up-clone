import { randomUUID } from "node:crypto";
import type { SavedViewConfig } from "@clickup/shared";

/** Example views on the landing list (one with board swimlanes); none is the default, so the demo opens unfiltered. */
export function buildDemoSavedViews(userId: string, listId: string) {
  const config: SavedViewConfig = {
    filters: { assignees: [], statuses: [], priorities: ["urgent", "high"], tags: [], due: { kind: "week" } },
    groupBy: "assignee",
    swimlanes: "none",
  };
  const byAssignee: SavedViewConfig = {
    filters: { assignees: [], statuses: [], priorities: [], tags: [], due: null },
    groupBy: "status",
    swimlanes: "assignee",
  };
  return [
    { id: randomUUID(), listId, userId, name: "Urgent this week, by person", config, isDefault: false },
    { id: randomUUID(), listId, userId, name: "By assignee", config: byAssignee, isDefault: false },
  ];
}
