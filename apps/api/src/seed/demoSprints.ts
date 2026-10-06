import { randomUUID } from "node:crypto";
import { DEMO_SPRINT_CARRIES, type DemoRows } from "./demoWorkspace.js";

const HOUR = 60 * 60 * 1000;

/**
 * Sprint history for the demo: a "sprint_carried" activity on every task carried into a later
 * sprint (logged on the evening the earlier sprint ended), and the committed vs completed points
 * snapshot of each completed sprint, which velocity reads. Sets the snapshots on `seed.lists` in
 * place, so it runs before the lists are written.
 */
export function buildDemoSprints(seed: DemoRows, actorId: string, newId: () => string = randomUUID) {
  const listById = new Map(seed.lists.map((l) => [l.id, l]));
  const taskById = new Map(seed.tasks.map((t) => [t.id, t]));
  const doneStatusIds = new Set(seed.statuses.filter((s) => s.type === "done").map((s) => s.id));

  const activities: { id: string; taskId: string; actorId: string; type: "sprint_carried"; data: Record<string, string | null>; createdAt: Date }[] = [];
  const carriedPoints = new Map<string, number>();
  for (const [taskKey, fromKey] of DEMO_SPRINT_CARRIES) {
    const task = taskById.get(seed.idsByKey.get(taskKey) ?? "");
    const from = listById.get(seed.idsByKey.get(fromKey) ?? "");
    const to = task && listById.get(task.listId);
    if (!task || !from?.sprintEnd || !to) continue;
    carriedPoints.set(from.id, (carriedPoints.get(from.id) ?? 0) + (task.points ?? 0));
    activities.push({
      id: newId(),
      taskId: task.id,
      actorId,
      type: "sprint_carried",
      data: { from: from.name, to: to.name, fromListId: from.id, points: task.points == null ? null : String(task.points) },
      createdAt: new Date(from.sprintEnd.getTime() + 5 * HOUR),
    });
  }

  for (const list of seed.lists) {
    if (list.sprintState !== "completed") continue;
    const tasks = seed.tasks.filter((t) => t.listId === list.id);
    const points = (rows: typeof tasks) => rows.reduce((sum, t) => sum + (t.points ?? 0), 0);
    const completed = points(tasks.filter((t) => doneStatusIds.has(t.statusId)));
    list.sprintCompletedPoints = completed;
    list.sprintCommittedPoints = points(tasks) + (carriedPoints.get(list.id) ?? 0);
  }
  return { activities };
}
