import type { DemoRows } from "./demoWorkspace.js";
import type { buildDemoTeammates } from "./demoTeammates.js";

type Team = ReturnType<typeof buildDemoTeammates>;

/**
 * Sprint 14 assignees by teammate first name, so the Workload view tells a story on landing:
 * Maya is over capacity today and tomorrow (4 tasks / 8-9 points a day), the rest of the team is
 * balanced, a few tasks sit in "Unassigned". (The guest is added to some of these by demoCollab.)
 */
const SPRINT_14_ASSIGNEES: Record<string, string[]> = {
  "api-rate-limit": ["Maya"],
  sso: ["Maya"],
  "release-notes": ["Maya", "Ava"],
  "csv-export": ["Maya"],
  "onboarding-checklist": ["Maya"],
  "board-virtualization": ["Maya", "Noah"],
  "dark-mode-charts": ["Maya"],
  "mobile-nav": ["Maya", "Sofia"],
  "billing-webhooks": ["Liam", "Ethan"],
  "flaky-e2e": ["Liam"],
  "search-index": ["Liam"],
  "audit-log": ["Sofia"],
  "recurring-tasks": ["Ethan"],
  "design-tokens": ["Liam"],
  "node-upgrade": ["Ethan"],
  "feature-flags": ["Noah"],
  "error-tracking": ["Sofia"],
  "welcome-emails": ["Ava"],
  "bulk-edit": ["Liam"],
  "i18n-strings": ["Sofia"],
  // Unassigned: notification-prefs, invite-modal, shortcuts-sheet, retro.
};

/** Per-day capacity overrides in the sprint's space (Ava is part-time: 2 tasks a day). */
const CAPACITY: Record<string, { capacityTasks?: number; capacityPoints?: number }> = {
  Ava: { capacityTasks: 2, capacityPoints: 4 },
};

/**
 * Replaces the random assignees on the Sprint 14 tasks with `SPRINT_14_ASSIGNEES` and sets the
 * capacity overrides, mutating `team` in place (runs before the rows are written).
 */
export function applyDemoWorkload(seed: DemoRows, team: Team) {
  const sprintListId = seed.idsByKey.get("sprint");
  if (!sprintListId) return;
  const sprintTaskIds = new Set(seed.tasks.filter((t) => t.listId === sprintListId).map((t) => t.id));
  const idOf = (name: string) => {
    const user = team.users.find((u) => u.name.startsWith(name));
    if (!user) throw new Error(`Demo teammate "${name}" not found`);
    return user.id;
  };

  const kept = team.assignees.filter((a) => !sprintTaskIds.has(a.taskId));
  for (const [key, names] of Object.entries(SPRINT_14_ASSIGNEES)) {
    const taskId = seed.idsByKey.get(`sprint.${key}`);
    if (!taskId) throw new Error(`Demo task "sprint.${key}" not found`);
    for (const name of names) kept.push({ taskId, userId: idOf(name) });
  }
  team.assignees.splice(0, team.assignees.length, ...kept);

  const workspaceId = seed.lists.find((l) => l.id === sprintListId)!.workspaceId;
  for (const [name, capacity] of Object.entries(CAPACITY)) {
    const userId = idOf(name);
    const member = team.members.find((m) => m.workspaceId === workspaceId && m.userId === userId);
    if (member) Object.assign(member, capacity);
  }
}
