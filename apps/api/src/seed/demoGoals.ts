import { randomUUID } from "node:crypto";
import type { GoalTargetType } from "@clickup/shared";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * Demo goals (OKRs), with varied progress: a Product launch goal (~36%: bug fixes + beta
 * customers), a Marketing signups goal (~68%: number, true/false and currency targets), and a
 * Sprint 14 goal linked to the active sprint's tasks, so completing one moves it (~45%, by points).
 * Due dates are calendar days at 12:00 UTC, like task due dates.
 */

const DAY = 24 * 60 * 60 * 1000;

interface DemoTarget {
  name: string;
  type: GoalTargetType;
  start?: number;
  current?: number;
  target?: number;
  unit?: string;
  /** Task keys (task targets), or a list key: every top-level task of that list. */
  tasks?: string[];
  list?: string;
}

interface DemoGoal {
  space: string;
  name: string;
  description: string;
  color: string;
  /** Index into the seeded teammates. */
  owner: number;
  due: number;
  targets: DemoTarget[];
}

const DEMO_GOALS: DemoGoal[] = [
  {
    space: "product",
    name: "Launch v2.0 by end of Q4",
    description: "Ship the v2.0 release with zero launch-blocking bugs and our first beta customers live on it.",
    color: "violet",
    owner: 0,
    due: 56,
    targets: [
      {
        name: "Fix launch-blocking bugs",
        type: "tasks",
        tasks: [
          "bugs.double-submit",
          "bugs.reset-link",
          "bugs.status-order",
          "bugs.safari-drag",
          "bugs.timezone-dates",
          "bugs.memory-leak",
          "bugs.slow-dashboard",
          "bugs.logout-redirect",
        ],
      },
      { name: "Beta customers onboarded", type: "number", start: 0, current: 14, target: 40 },
    ],
  },
  {
    space: "marketing",
    name: "Grow weekly signups to 500",
    description: "Turn the Q4 campaign into steady weekly growth: more signups, a referral loop and new MRR.",
    color: "amber",
    owner: 2,
    due: 24,
    targets: [
      { name: "Weekly signups", type: "number", start: 0, current: 340, target: 500 },
      { name: "Referral program live", type: "boolean", current: 1 },
      { name: "New MRR from campaign signups", type: "currency", start: 0, current: 4200, target: 12000, unit: "$" },
    ],
  },
  {
    space: "product",
    name: "Ship Sprint 14 commitments",
    description: "Everything committed in Sprint 14 is done by the sprint review.",
    color: "emerald",
    owner: 1,
    due: 7,
    targets: [{ name: "Sprint 14 tasks done", type: "tasks", list: "sprint" }],
  },
];

const noonUtc = (now: Date, offset: number) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset, 12));

export function buildDemoGoals(
  ownerUserId: string,
  seed: Pick<DemoRows, "idsByKey" | "tasks">,
  teammateIds: string[],
  now = new Date(),
  newId: () => string = randomUUID,
) {
  const goals: {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    color: string;
    ownerId: string;
    dueDate: Date;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  const targets: {
    id: string;
    goalId: string;
    name: string;
    type: GoalTargetType;
    startValue: number;
    currentValue: number;
    targetValue: number;
    unit: string | null;
    order: number;
    createdAt: Date;
  }[] = [];
  const targetTasks: { targetId: string; taskId: string; createdAt: Date }[] = [];

  DEMO_GOALS.forEach((goal, g) => {
    const workspaceId = seed.idsByKey.get(goal.space);
    if (!workspaceId) return;
    const goalId = newId();
    const createdAt = new Date(now.getTime() - (20 - g) * DAY);
    goals.push({
      id: goalId,
      workspaceId,
      name: goal.name,
      description: goal.description,
      color: goal.color,
      ownerId: teammateIds[goal.owner] ?? ownerUserId,
      dueDate: noonUtc(now, goal.due),
      createdById: ownerUserId,
      createdAt,
      updatedAt: new Date(now.getTime() - (g + 1) * 3 * 60 * 60 * 1000),
    });
    goal.targets.forEach((t, order) => {
      const targetId = newId();
      targets.push({
        id: targetId,
        goalId,
        name: t.name,
        type: t.type,
        startValue: t.start ?? 0,
        currentValue: t.current ?? 0,
        targetValue: t.type === "boolean" ? 1 : (t.target ?? 0),
        unit: t.unit ?? null,
        order,
        createdAt: new Date(createdAt.getTime() + order * 1000),
      });
      const listId = t.list ? seed.idsByKey.get(t.list) : undefined;
      const taskIds = listId
        ? seed.tasks.filter((task) => task.listId === listId).map((task) => task.id)
        : (t.tasks ?? []).map((key) => seed.idsByKey.get(key)).filter((id): id is string => !!id);
      taskIds.forEach((taskId, i) =>
        targetTasks.push({ targetId, taskId, createdAt: new Date(createdAt.getTime() + i * 1000) }),
      );
    });
  });
  return { goals, targets, targetTasks };
}
