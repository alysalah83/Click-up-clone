import { randomUUID } from "node:crypto";
import type { SavedViewConfig } from "@clickup/shared";

/** One example view on the landing list; not the default, so the demo opens unfiltered. */
export function buildDemoSavedViews(userId: string, listId: string) {
  const config: SavedViewConfig = {
    filters: { assignees: [], statuses: [], priorities: ["urgent", "high"], tags: [], due: { kind: "week" } },
    groupBy: "assignee",
  };
  return [
    { id: randomUUID(), listId, userId, name: "Urgent this week, by person", config, isDefault: false },
  ];
}
