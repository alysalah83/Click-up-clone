import { randomUUID } from "node:crypto";
import type { Priority, StatusType } from "@clickup/shared";
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
}

export interface DemoList {
  key: string;
  name: string;
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

const SPRINT_BOARD: DemoList = {
  key: "sprint",
  name: "Sprint Board",
  statuses: statusSet(
    "sprint",
    ["to do", "neutral"],
    ["in progress", "violet"],
    ["in review", "TiEye", "amber"],
    ["done", "emerald"],
  ),
  tasks: [
    sprint("sso", "Add Google SSO to the login page", "active", "high", 2, -3),
    sprint("onboarding-checklist", "Build onboarding checklist for new workspaces", "open", "normal", 5, 3),
    sprint("api-rate-limit", "Rate-limit the public API per workspace", "custom", "urgent", 0, -2),
    sprint("csv-export", "Export tasks to CSV", "open", "normal", 9, 7),
    sprint("dark-mode-charts", "Dark mode support for dashboard charts", "active", "low", 4, 1),
    sprint("billing-webhooks", "Handle Stripe billing webhooks idempotently", "custom", "high", -1, -4),
    sprint("search-index", "Full-text search across tasks and docs", "open", "high", 14, 10),
    sprint("notification-prefs", "Notification preferences page", "open", "normal"),
    sprint("recurring-tasks", "Recurring tasks: daily, weekly, monthly", "open", "low", 21, 16),
    sprint("board-virtualization", "Virtualize the board for lists with 1k+ tasks", "active", "urgent", 1, -2),
    sprint("audit-log", "Audit log for workspace admin actions", "open", "normal", 12),
    sprint("mobile-nav", "Responsive navigation for small screens", "custom", "normal", 3, 0),
    sprint("release-notes", "Write release notes for v2.4", "open", "low", 0),
    sprint("flaky-e2e", "Fix flaky checkout E2E test", "active", "high", -2),
    sprint("design-tokens", "Migrate buttons to the new design tokens", "done", "normal", -6, -9),
    sprint("node-upgrade", "Upgrade services to Node 22", "done", "high", -10, -12),
    sprint("feature-flags", "Feature flags for gradual rollouts", "done", "normal", -4, -8),
    sprint("error-tracking", "Add error tracking to the web app", "done", "low", -14),
    sprint("welcome-emails", "Welcome email sequence for trial users", "done", "normal", -3, -5),
    sprint("bulk-edit", "Bulk edit priority and status in table view", "done", "high", -7, -11),
    sprint("invite-modal", "Redesign the invite teammate modal", "open", "none"),
    sprint("shortcuts-sheet", "Keyboard shortcuts cheat sheet", "open", "none"),
    sprint("retro", "Sprint 14 retrospective", "open", "normal", 6),
    sprint("i18n-strings", "Extract UI strings for translation", "done", "none"),
  ],
};


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
      lists: [SPRINT_BOARD, BUG_TRACKER],
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
  lists: { id: string; name: string; userId: string; workspaceId: string; createdAt: Date }[];
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
      rows.lists.push({ id: listId, name: list.name, userId, workspaceId, createdAt: new Date(listCreatedAt) });

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
        rows.tasks.push({
          id: idFor(t.key),
          name: t.name,
          userId,
          listId,
          statusId,
          priority: t.priority,
          startDate: start === undefined ? null : noonUtc(now, start),
          endDate: t.due === undefined ? null : noonUtc(now, t.due),
          createdAt: new Date(now.getTime() - createdDaysAgo * DAY - (taskIndex % 7) * 37 * MINUTE),
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
