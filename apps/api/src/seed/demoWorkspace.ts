import { randomUUID } from "node:crypto";
import type { Priority, RecurrenceType, SprintState, StatusType } from "@clickup/shared";
import { HIGHEST_ORDER } from "../consts/status.const.js";

/**
 * The demo workspace every guest gets on "Continue as Guest".
 *
 * Plain data with a stable `key` on every space, list, status and task, so later steps can
 * attach more data by key (assignees in Step 2, subtasks and tags in Step 3). Dates are whole
 * day offsets from the day of seeding; `buildDemoWorkspace` turns them into rows.
 */

export interface DemoStatus {
  key: string;
  name: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  type: StatusType;
  order: number;
  isDefault: boolean;
  /** Board column WIP limit. */
  wipLimit?: number;
}

export interface DemoTask {
  key: string;
  name: string;
  /** Key of a status of the same list. */
  status: string;
  priority: Priority;
  /** Day offset of the start date; defaults to `due`. */
  start?: number;
  /** Day offset of the due (end) date. No `due` means an undated task. */
  due?: number;
  /** Sprint points. */
  points?: number;
  /** Fractional day offset of the completion time (done tasks); defaults to a recent time. */
  doneAt?: number;
}

export interface DemoList {
  key: string;
  name: string;
  /** Makes the list a sprint: number, start/end day offsets (inclusive) and state. */
  sprint?: { number: number; start: number; end: number; state: SprintState };
  statuses: DemoStatus[];
  tasks: DemoTask[];
}

export interface DemoSpace {
  key: string;
  name: string;
  avatar: { icon: string; color: string };
  lists: DemoList[];
}

export interface DemoTemplate {
  spaces: DemoSpace[];
  /** The list a new guest lands on. */
  landingListKey: string;
}

/** Status sets follow the app's rules: one open, a default active, a custom active, one done. */
function statusSet(
  prefix: string,
  open: [name: string, color: string],
  active: [name: string, color: string],
  custom: [name: string, icon: string, color: string],
  done: [name: string, color: string],
): DemoStatus[] {
  const status = (
    key: string,
    name: string,
    icon: string,
    color: string,
    type: StatusType,
    order: number,
    isDefault: boolean,
  ): DemoStatus => ({
    key: `${prefix}.${key}`,
    name,
    icon,
    iconColor: color,
    bgColor: color,
    type,
    order,
    isDefault,
  });
  return [
    status("open", open[0], "circleDotted", open[1], "open", 100, true),
    status("active", active[0], "inProgress", active[1], "active", 200, true),
    status("custom", custom[0], custom[1], custom[2], "active", 300, false),
    status("done", done[0], "complete", done[1], "done", HIGHEST_ORDER, true),
  ];
}

/** Task factory for one list: keys become `<prefix>.<key>`, statuses `open|active|custom|done`. */
const tasksFor =
  (prefix: string) =>
  (
    key: string,
    name: string,
    status: "open" | "active" | "custom" | "done",
    priority: Priority,
    due?: number,
    start?: number,
  ): DemoTask => ({ key: `${prefix}.${key}`, name, status: `${prefix}.${status}`, priority, due, start });

const sprint = tasksFor("sprint");

/** The sprint lists share one status set (so carried tasks keep their status by name). */
const sprintStatuses = (prefix: string) =>
  statusSet(prefix, ["to do", "neutral"], ["in progress", "violet"], ["in review", "TiEye", "amber"], ["done", "emerald"]);

/** Points of the active sprint's tasks, and when its done tasks were completed (day offsets). */
const SPRINT_14_POINTS: Record<string, number> = {
  sso: 3, "onboarding-checklist": 2, "api-rate-limit": 3, "csv-export": 2, "dark-mode-charts": 1,
  "billing-webhooks": 3, "search-index": 3, "notification-prefs": 1, "recurring-tasks": 2,
  "board-virtualization": 3, "audit-log": 2, "mobile-nav": 2, "release-notes": 1, "flaky-e2e": 1,
  "design-tokens": 3, "node-upgrade": 5, "feature-flags": 5, "error-tracking": 2, "welcome-emails": 3,
  "bulk-edit": 5, "invite-modal": 1, "shortcuts-sheet": 1, retro: 1, "i18n-strings": 3,
};
const SPRINT_14_DONE_AT: Record<string, number> = {
  "design-tokens": -5.3, "node-upgrade": -4.6, "feature-flags": -3.5, "error-tracking": -2.7,
  "welcome-emails": -1.8, "bulk-edit": -1.2, "i18n-strings": -0.3,
};

// Due dates bunch up today and tomorrow so the Workload view shows Maya overloaded (see demoWorkload.ts).
const SPRINT_BOARD: DemoList = {
  key: "sprint",
  name: "Sprint 14",
  sprint: { number: 14, start: -6, end: 7, state: "active" },
  // WIP limits: "in progress" (4 tasks) is over its limit on landing, "in review" (3) sits at it.
  statuses: sprintStatuses("sprint").map((st) =>
    st.key === "sprint.active" ? { ...st, wipLimit: 3 } : st.key === "sprint.custom" ? { ...st, wipLimit: 3 } : st,
  ),
  tasks: [
    sprint("sso", "Add Google SSO to the login page", "active", "high", 0, -3),
    sprint("onboarding-checklist", "Build onboarding checklist for new workspaces", "open", "normal", 1, -1),
    sprint("api-rate-limit", "Rate-limit the public API per workspace", "custom", "urgent", 0, -2),
    sprint("csv-export", "Export tasks to CSV", "open", "normal", 0, -2),
    sprint("dark-mode-charts", "Dark mode support for dashboard charts", "active", "low", 1, 0),
    sprint("billing-webhooks", "Handle Stripe billing webhooks idempotently", "custom", "high", -1, -4),
    sprint("search-index", "Full-text search across tasks and docs", "open", "high", 14, 10),
    sprint("notification-prefs", "Notification preferences page", "open", "normal"),
    sprint("recurring-tasks", "Recurring tasks: daily, weekly, monthly", "open", "low", 21, 16),
    sprint("board-virtualization", "Virtualize the board for lists with 1k+ tasks", "active", "urgent", 1, -2),
    sprint("audit-log", "Audit log for workspace admin actions", "open", "normal", 12),
    sprint("mobile-nav", "Responsive navigation for small screens", "custom", "normal", 1, 0),
    sprint("release-notes", "Write release notes for v2.4", "open", "low", 0),
    sprint("flaky-e2e", "Fix flaky checkout E2E test", "active", "high", -2),
    sprint("design-tokens", "Migrate buttons to the new design tokens", "done", "normal", -6, -9),
    sprint("node-upgrade", "Upgrade services to Node 22", "done", "high", -10, -12),
    sprint("feature-flags", "Feature flags for gradual rollouts", "done", "normal", -4, -8),
    sprint("error-tracking", "Add error tracking to the web app", "done", "low", -14),
    sprint("welcome-emails", "Welcome email sequence for trial users", "done", "normal", -3, -5),
    sprint("bulk-edit", "Bulk edit priority and status in table view", "done", "high", -7, -11),
    sprint("invite-modal", "Redesign the invite teammate modal", "open", "none"),
    sprint("shortcuts-sheet", "Keyboard shortcuts cheat sheet", "open", "none", 2),
    sprint("retro", "Sprint 14 retrospective", "open", "normal", 6),
    sprint("i18n-strings", "Extract UI strings for translation", "done", "none"),
  ].map((t) => {
    const key = t.key.slice("sprint.".length);
    return { ...t, points: SPRINT_14_POINTS[key], doneAt: SPRINT_14_DONE_AT[key] };
  }),
};

/** Sprint history task: done (with points and a completion day offset) or open. */
const sprintTask =
  (prefix: string) =>
  (key: string, name: string, points: number, doneAt?: number, priority: Priority = "normal"): DemoTask => ({
    key: `${prefix}.${key}`,
    name,
    status: `${prefix}.${doneAt === undefined ? "open" : "done"}`,
    priority,
    points,
    doneAt,
    ...(doneAt !== undefined && { due: Math.ceil(doneAt), start: Math.ceil(doneAt) - 2 }),
  });

const s11 = sprintTask("sprint11");
const SPRINT_11: DemoList = {
  key: "sprint11",
  name: "Sprint 11",
  sprint: { number: 11, start: -48, end: -35, state: "completed" },
  statuses: sprintStatuses("sprint11"),
  tasks: [
    s11("color-tokens", "Design system: color tokens", 5, -46.3, "high"),
    s11("swimlanes", "Kanban swimlanes spike", 3, -44.1, "low"),
    s11("invite-flow", "Invite flow for new teammates", 8, -42.0, "high"),
    s11("avatar-colors", "Avatar colors for teammates", 2, -38.8),
    s11("rich-text", "Rich text editor for task descriptions", 8, -39.5, "urgent"),
    s11("csv-import", "Fix CSV import encoding", 2, -37.4),
    s11("retro", "Sprint 11 retrospective", 1, -35.2, "none"),
  ],
};

const s12 = sprintTask("sprint12");
const SPRINT_12: DemoList = {
  key: "sprint12",
  name: "Sprint 12",
  sprint: { number: 12, start: -34, end: -21, state: "completed" },
  statuses: sprintStatuses("sprint12"),
  tasks: [
    s12("public-api", "Public API v1: task endpoints", 8, -32.5, "high"),
    s12("webhooks", "Webhooks for task events", 5, -30.1, "high"),
    s12("two-factor", "Two-factor authentication", 5, -28.4, "urgent"),
    s12("gantt", "Gantt chart prototype", 8, -26.2),
    s12("reactions", "Comment reactions", 3, -24.6, "low"),
    s12("flaky-login", "Fix flaky login test", 3, -22.0),
    s12("digest", "Email digest of unread notifications", 3, -23.3),
    s12("retro", "Sprint 12 retrospective", 1, -21.2, "none"),
  ],
};

const s13 = sprintTask("sprint13");
const SPRINT_13: DemoList = {
  key: "sprint13",
  name: "Sprint 13",
  sprint: { number: 13, start: -20, end: -7, state: "completed" },
  statuses: sprintStatuses("sprint13"),
  tasks: [
    s13("session-store", "Migrate auth to the new session store", 5, -18.4, "high"),
    s13("activity-pagination", "Paginate the activity feed", 3, -17.2),
    s13("timezone-reminders", "Fix timezone bug in recurring reminders", 2, -16.0, "high"),
    s13("metering", "Usage-based billing: metering events", 8, -14.5, "urgent"),
    s13("templates", "Workspace templates gallery", 5, -12.3),
    s13("tooltips", "Onboarding tooltips for the board view", 3, -10.6, "low"),
    s13("list-perf", "Improve list view load time", 3, -9.4, "high"),
    s13("a11y-modals", "Accessibility pass on modals", 2, -8.2),
    s13("retro", "Sprint 13 retrospective", 1, -7.1, "none"),
  ],
};

const s15 = sprintTask("sprint15");
const SPRINT_15: DemoList = {
  key: "sprint15",
  name: "Sprint 15",
  sprint: { number: 15, start: 8, end: 21, state: "planned" },
  statuses: sprintStatuses("sprint15"),
  tasks: [
    s15("saml", "SAML SSO for enterprise workspaces", 8, undefined, "high"),
    s15("calendar-drag", "Drag to reschedule in the calendar", 5),
    s15("roadmap", "Public roadmap page", 3, undefined, "low"),
    s15("digest-settings", "Notification digest settings", 3),
    s15("archive-lists", "Archive completed lists", 2, undefined, "low"),
  ],
};

/**
 * Unfinished tasks carried from one sprint into the next ([task, from sprint list]). The tasks
 * live in the later sprint; the history keeps the earlier sprints' burndown and velocity honest.
 */
export const DEMO_SPRINT_CARRIES: [task: string, fromList: string][] = [
  ["sprint12.webhooks", "sprint11"],
  ["sprint13.timezone-reminders", "sprint12"],
  ["sprint13.a11y-modals", "sprint12"],
  ["sprint.billing-webhooks", "sprint13"],
  ["sprint.api-rate-limit", "sprint13"],
  ["sprint.node-upgrade", "sprint13"],
];


const bug = tasksFor("bugs");

const BUG_TRACKER: DemoList = {
  key: "bugs",
  name: "Bug Tracker",
  statuses: statusSet(
    "bugs",
    ["reported", "red"],
    ["triaged", "amber"],
    ["fixing", "TiSpanner", "blue"],
    ["verified", "green"],
  ),
  tasks: [
    bug("safari-drag", "Drag and drop fails on Safari 17", "custom", "urgent", 0, -1),
    bug("timezone-dates", "Due dates shift by one day for UTC-8 users", "active", "high", 2),
    bug("double-submit", "Create task button can submit twice", "done", "normal", -5),
    bug("avatar-upload", "Avatar upload rejects PNGs over 2 MB", "open", "low"),
    bug("logout-redirect", "Logout redirects to a 404 page", "custom", "high", -1),
    bug("csv-encoding", "CSV export breaks non-Latin characters", "open", "normal", 8),
    bug("slow-dashboard", "Dashboard takes 6 s to load with 20 lists", "active", "urgent", 1),
    bug("duplicate-emails", "Duplicate notification emails on comment edits", "custom", "normal", 3, 1),
    bug("dark-contrast", "Low contrast on disabled buttons in dark mode", "open", "low"),
    bug("reset-link", "Password reset link expires too early", "done", "high", -8),
    bug("calendar-overflow", "Calendar cell overflows with more than 5 tasks", "active", "normal", 6),
    bug("stale-search", "Search shows stale results after clearing the query", "open", "normal", 10),
    bug("memory-leak", "Memory leak when switching boards quickly", "custom", "urgent", -3, -6),
    bug("tooltip-flicker", "Tooltip flickers on hover in table view", "open", "none"),
    bug("status-order", "Status order resets after rename", "done", "normal", -2),
    bug("table-pagination", "Table pagination skips the last row", "done", "high", -9, -10),
    bug("mobile-keyboard", "Mobile keyboard covers the task name input", "active", "low", 13),
    bug("pdf-timeout", "PDF export times out for large lists", "open", "high", 4),
    bug("emoji-sidebar", "Emoji in list names break the sidebar width", "done", "low", -12),
    bug("session-expiry", "Session expires while typing a long comment", "active", "normal"),
  ],
};


const content = tasksFor("content");

const CONTENT_CALENDAR: DemoList = {
  key: "content",
  name: "Content Calendar",
  statuses: statusSet(
    "content",
    ["ideas", "gray"],
    ["drafting", "indigo"],
    ["editing", "TiPencil", "purple"],
    ["published", "teal"],
  ),
  tasks: [
    content("sprint-mistakes", "Blog: 7 sprint planning mistakes to avoid", "custom", "high", 1, -3),
    content("case-study", "Case study: how Northwind cut meetings by 30%", "active", "normal", 6, 2),
    content("newsletter", "October product newsletter", "active", "high", 3, 0),
    content("carousel", "LinkedIn carousel: 5 dashboard templates", "open", "low", 11),
    content("video-tutorial", "Video tutorial: building your first board", "open", "normal", 17, 13),
    content("seo-audit", "SEO audit of the top 20 blog posts", "custom", "normal", -2),
    content("webinar-recap", "Webinar recap: async standups", "done", "normal", -6),
    content("remote-retros", "Guide: running remote retrospectives", "done", "high", -11, -15),
    content("launch-thread", "Social thread for the Q4 feature drop", "active", "urgent", 0),
    content("podcast-pitch", "Podcast guest pitch list", "open", "none"),
    content("customer-quotes", "Collect customer quotes for the homepage", "open", "low"),
    content("template-copy", "Template gallery copy refresh", "custom", "normal", 5, 4),
    content("changelog", "September changelog post", "done", "low", -3),
    content("okrs-kpis", "Blog: OKRs vs. KPIs for product teams", "done", "normal", -17),
    content("onboarding-email", "Rewrite onboarding email #3", "custom", "urgent", -1),
    content("infographic", "Infographic: the state of remote work", "open", "normal", 24, 20),
    content("comparison-page", "Comparison page: us vs. spreadsheets", "active", "high", 9, 5),
    content("holiday-social", "Holiday social media calendar", "open", "low"),
  ],
};


const launch = tasksFor("launch");

const Q4_LAUNCH: DemoList = {
  key: "launch",
  name: "Q4 Launch Campaign",
  statuses: statusSet(
    "launch",
    ["planned", "stone"],
    ["in progress", "blue"],
    ["blocked", "TiWarning", "red"],
    ["launched", "lime"],
  ),
  tasks: [
    launch("plan", "Finalize Q4 launch plan and owners", "done", "urgent", -8, -14),
    launch("landing-page", "Launch landing page design", "active", "high", 2, -4),
    launch("pricing-page", "Update pricing page for the new tiers", "custom", "urgent", -1, -3),
    launch("press-kit", "Press kit and media list", "active", "normal", 4, 1),
    launch("demo-video", "90-second product demo video", "active", "high", 8, 3),
    launch("ads-budget", "Approve paid ads budget", "custom", "high", 0),
    launch("beta-feedback", "Summarize beta customer feedback", "done", "normal", -5),
    launch("partner-emails", "Partner co-marketing emails", "open", "normal", 12, 10),
    launch("launch-day", "Launch day checklist", "open", "high", 20, 19),
    launch("sales-deck", "Sales enablement deck", "active", "normal", 5, 0),
    launch("meetup-venue", "Book a venue for the launch meetup", "open", "low", 26),
    launch("help-docs", "Help center articles for new features", "open", "normal", 15, 9),
    launch("analytics", "Launch analytics dashboard", "open", "low"),
    launch("store-screenshots", "App store screenshots and copy", "custom", "normal", 7),
    launch("support-training", "Internal training for the support team", "open", "normal", 18, 16),
    launch("teaser-post", "Teaser post on social channels", "done", "low", -2),
    launch("swag", "Order launch swag", "open", "none"),
    launch("retro", "Launch retrospective", "open", "none", 33),
  ],
};

export const DEMO_TEMPLATE: DemoTemplate = {
  landingListKey: "sprint",
  spaces: [
    {
      key: "product",
      name: "Product",
      avatar: { icon: "TiLightbulb", color: "violet" },
      lists: [SPRINT_11, SPRINT_12, SPRINT_13, SPRINT_BOARD, SPRINT_15, BUG_TRACKER],
    },
    {
      key: "marketing",
      name: "Marketing",
      avatar: { icon: "TiChartLine", color: "amber" },
      lists: [CONTENT_CALENDAR, Q4_LAUNCH],
    },
  ],
};

// ---------------------------------------------------------------------------------------------

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export interface DemoRows {
  avatars: { id: string; icon: string; color: string }[];
  workspaces: { id: string; name: string; userId: string; avatarId: string; createdAt: Date }[];
  lists: {
    id: string;
    name: string;
    userId: string;
    workspaceId: string;
    createdAt: Date;
    sprintNumber?: number;
    sprintStart?: Date;
    sprintEnd?: Date;
    sprintState?: SprintState;
    sprintCommittedPoints?: number;
    sprintCompletedPoints?: number;
  }[];
  statuses: (Omit<DemoStatus, "key"> & { id: string; userId: string; listId: string; createdAt: Date })[];
  tasks: {
    id: string;
    name: string;
    userId: string;
    listId: string;
    statusId: string;
    priority: Priority;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    recurrenceType?: RecurrenceType;
    recurrenceInterval?: number;
    points?: number | null;
    completedAt?: Date | null;
  }[];
  landingListId: string;
  /** Template key -> generated id, for every space, list, status and task. */
  idsByKey: Map<string, string>;
}

/** 12:00 UTC `offset` days from `now`'s UTC day: the same calendar day in almost every timezone. */
const noonUtc = (now: Date, offset: number) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset, 12));

/** Turns the template into rows ready for `createMany`, with ids generated up front. */
export function buildDemoWorkspace(
  userId: string,
  now = new Date(),
  template: DemoTemplate = DEMO_TEMPLATE,
  newId: () => string = randomUUID,
): DemoRows {
  const rows: Omit<DemoRows, "landingListId"> = {
    avatars: [],
    workspaces: [],
    lists: [],
    statuses: [],
    tasks: [],
    idsByKey: new Map(),
  };
  const idFor = (key: string) => {
    const id = newId();
    rows.idsByKey.set(key, id);
    return id;
  };
  // The sidebar orders spaces and lists by createdAt; spread them a minute apart, a month ago.
  const monthAgo = now.getTime() - 30 * DAY;
  let minute = 0;
  let taskIndex = 0;

  for (const space of template.spaces) {
    const avatarId = newId();
    rows.avatars.push({ id: avatarId, ...space.avatar });
    const workspaceId = idFor(space.key);
    rows.workspaces.push({
      id: workspaceId,
      name: space.name,
      userId,
      avatarId,
      createdAt: new Date(monthAgo + minute++ * MINUTE),
    });

    for (const list of space.lists) {
      const listId = idFor(list.key);
      const listCreatedAt = monthAgo + minute++ * MINUTE;
      rows.lists.push({
        id: listId,
        name: list.name,
        userId,
        workspaceId,
        createdAt: new Date(listCreatedAt),
        ...(list.sprint && {
          sprintNumber: list.sprint.number,
          sprintStart: noonUtc(now, list.sprint.start),
          sprintEnd: noonUtc(now, list.sprint.end),
          sprintState: list.sprint.state,
        }),
      });

      list.statuses.forEach(({ key, ...status }, i) => {
        rows.statuses.push({
          ...status,
          id: idFor(key),
          userId,
          listId,
          createdAt: new Date(listCreatedAt + i * 1000),
        });
      });

      for (const t of list.tasks) {
        const statusId = rows.idsByKey.get(t.status);
        if (!statusId || !list.statuses.some((s) => s.key === t.status))
          throw new Error(`Demo task "${t.key}" uses unknown status "${t.status}"`);
        const start = t.due === undefined ? undefined : (t.start ?? t.due);
        // Created a few days before its start (or before today), never in the future.
        const createdDaysAgo = Math.min(Math.max(0, -(start ?? 0)) + 2 + (taskIndex % 6), 29);
        let createdAt = new Date(now.getTime() - createdDaysAgo * DAY - (taskIndex % 7) * 37 * MINUTE);
        // Tasks of older sprints were created a couple of days before they were completed.
        if (t.doneAt !== undefined && createdAt.getTime() > now.getTime() + (t.doneAt - 2) * DAY)
          createdAt = new Date(now.getTime() + (t.doneAt - 2 - (taskIndex % 3)) * DAY);
        // Done tasks get a completion time: the template's, else a plausible one in the last ~10 days.
        const isDone = list.statuses.find((s) => s.key === t.status)?.type === "done";
        const doneAt = Math.min(
          now.getTime(),
          Math.max(
            createdAt.getTime() + 6 * 60 * MINUTE,
            t.doneAt !== undefined
              ? Math.round(now.getTime() + t.doneAt * DAY)
              : now.getTime() - (taskIndex % 10) * DAY - 3 * 60 * MINUTE,
          ),
        );
        rows.tasks.push({
          id: idFor(t.key),
          name: t.name,
          userId,
          listId,
          statusId,
          priority: t.priority,
          startDate: start === undefined ? null : noonUtc(now, start),
          endDate: t.due === undefined ? null : noonUtc(now, t.due),
          createdAt,
          updatedAt: isDone ? new Date(doneAt) : createdAt,
          points: t.points ?? null,
          completedAt: isDone ? new Date(doneAt) : null,
        });
        taskIndex++;
      }
    }
  }

  const landingListId = rows.idsByKey.get(template.landingListKey) ?? rows.lists[0]?.id;
  if (!landingListId) throw new Error("Demo template has no lists");
  return { ...rows, landingListId };
}

/** "Blocked by" links of the default demo template, by task key: [task, blocked by]. */
export const DEMO_DEPENDENCIES: [task: string, dependsOn: string][] = [
  ["sprint.onboarding-checklist", "sprint.sso"],
  ["sprint.search-index", "sprint.csv-export"],
  ["sprint.recurring-tasks", "sprint.search-index"],
  ["sprint.dark-mode-charts", "sprint.board-virtualization"],
  ["sprint.mobile-nav", "sprint.dark-mode-charts"],
];

/** Dependency rows for the demo tasks; links to keys missing from the seed are skipped. */
export function buildDemoDependencies(seed: DemoRows) {
  return DEMO_DEPENDENCIES.flatMap(([task, dependsOn]) => {
    const taskId = seed.idsByKey.get(task);
    const dependsOnId = seed.idsByKey.get(dependsOn);
    return taskId && dependsOnId ? [{ taskId, dependsOnId }] : [];
  });
}

/** Two demo automations, attached by list key (only for the default template). */
export function buildDemoAutomations(seed: Pick<DemoRows, "idsByKey">, newId: () => string = randomUUID) {
  const rows: {
    id: string;
    listId: string;
    name: string;
    enabled: boolean;
    trigger: { type: "status_changed"; to: "done" } | { type: "task_created" };
    actions: ({ type: "notify_assignees" } | { type: "set_priority"; priority: Priority })[];
  }[] = [];
  const sprintId = seed.idsByKey.get("sprint");
  const bugsId = seed.idsByKey.get("bugs");
  if (sprintId)
    rows.push({
      id: newId(),
      listId: sprintId,
      name: "When status becomes Done, notify assignees",
      enabled: true,
      trigger: { type: "status_changed", to: "done" },
      actions: [{ type: "notify_assignees" }],
    });
  if (bugsId)
    rows.push({
      id: newId(),
      listId: bugsId,
      name: "When a task is created, set priority High",
      enabled: true,
      trigger: { type: "task_created" },
      actions: [{ type: "set_priority", priority: "high" }],
    });
  return rows;
}
