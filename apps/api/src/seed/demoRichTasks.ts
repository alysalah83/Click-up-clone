import { randomUUID } from "node:crypto";
import type { ActivityType, Priority } from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * Step 3 demo content, attached to the demo workspace by task key: rich descriptions, subtasks,
 * checklists, workspace tags and a backdated activity history written by the fake teammates.
 * Pure (no queries), so the rows join the guest's single batched `$transaction`.
 */

// --- Tiptap JSON builders --------------------------------------------------------------------

type Node = Prisma.InputJsonObject;

/** `**bold**` segments become bold marks. */
function inline(text: string): Node[] {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**")
        ? { type: "text", text: part.slice(2, -2), marks: [{ type: "bold" }] }
        : { type: "text", text: part },
    );
}
const h = (level: 2 | 3, text: string): Node => ({
  type: "heading",
  attrs: { level },
  content: inline(text),
});
const p = (text: string): Node => ({
  type: "paragraph",
  content: inline(text),
});
const ul = (...items: string[]): Node => ({
  type: "bulletList",
  content: items.map((item) => ({ type: "listItem", content: [p(item)] })),
});
const ol = (...items: string[]): Node => ({
  type: "orderedList",
  attrs: { start: 1 },
  content: items.map((item) => ({ type: "listItem", content: [p(item)] })),
});
/** `[x] done` / `[ ] open` items. */
const todo = (...items: string[]): Node => ({
  type: "taskList",
  content: items.map((item) => ({
    type: "taskItem",
    attrs: { checked: item.startsWith("[x]") },
    content: [p(item.slice(4))],
  })),
});
const doc = (...content: Node[]): Node => ({ type: "doc", content });

/** The builders, for other demo content (task templates). */
export const tiptap = { h, p, ul, ol, todo, doc };

export const DEMO_DESCRIPTIONS: Record<string, Node> = {
  "sprint.sso": doc(
    h(2, "Goal"),
    p(
      "Let people sign in with their **Google Workspace** account, so new teams skip the password step.",
    ),
    h(3, "Scope"),
    ul(
      "OAuth 2.0 with PKCE",
      "Link an existing account by **verified email**",
      "Admin toggle to enforce SSO",
    ),
    h(3, "Acceptance"),
    todo(
      "[x] Consent screen approved",
      "[x] Callback handles denied consent",
      "[ ] Enforced-SSO workspaces hide the password form",
    ),
  ),
  "sprint.api-rate-limit": doc(
    p(
      "Large customers hit the public API from CI jobs and starve everyone else. We need **per-workspace** limits.",
    ),
    h(3, "Proposal"),
    ul(
      "Token bucket: **600 req/min** per workspace, burst 100",
      "Return `429` with a `Retry-After` header",
      "Enterprise plans get 5x",
    ),
    h(3, "Rollout"),
    ol(
      "Ship in log-only mode for a week",
      "Email the 12 workspaces above the limit",
      "Enforce",
    ),
  ),
  "sprint.billing-webhooks": doc(
    p(
      "Stripe retries webhooks, and we saw **duplicate invoices** twice last month.",
    ),
    ul(
      "Store the event id and skip ones we already handled",
      "Wrap each handler in a transaction",
      "Alert when an event fails 3 times",
    ),
    todo(
      "[x] Add the processed_events table",
      "[ ] Replay last month's events in staging",
    ),
  ),
  "sprint.board-virtualization": doc(
    h(2, "Problem"),
    p(
      "Boards with **1,000+ tasks** take seconds to render and scrolling stutters on laptops.",
    ),
    h(3, "Plan"),
    ul(
      "Virtualize each column with a windowed list",
      "Keep drag and drop working across columns",
      "Measure before and after with the profiler",
    ),
    p("**Target:** first paint under 300 ms for 2k tasks."),
  ),
  "sprint.search-index": doc(
    p(
      "Search today only matches task names. Customers expect to find words in **descriptions and docs** too.",
    ),
    h(3, "Approach"),
    ul(
      "Postgres full-text search with a generated tsvector column",
      "Rank by recency and match quality",
      "Highlight matches in results",
    ),
    h(3, "Out of scope"),
    ul("Attachments", "Search across workspaces"),
  ),
  "sprint.onboarding-checklist": doc(
    p(
      "A short checklist on the first board, so new workspaces reach their **first completed task** faster.",
    ),
    todo(
      "[ ] Create your first list",
      "[ ] Invite a teammate",
      "[ ] Move a task to Done",
    ),
  ),
  "sprint.flaky-e2e": doc(
    p("The checkout E2E test fails about **1 in 8** runs on CI."),
    h(3, "Findings so far"),
    ul(
      "Fails only on the Linux runner",
      "The payment iframe sometimes loads after the click",
      "Retrying hides the problem, so no retries",
    ),
  ),
  "bugs.safari-drag": doc(
    h(3, "Steps to reproduce"),
    ol(
      "Open any board in Safari 17",
      "Drag a card to another column",
      "Release over the column header",
    ),
    p(
      "**Expected:** the card moves. **Actual:** it snaps back and the page scrolls to the top.",
    ),
    p("Affects about 9% of weekly active users."),
  ),
  "bugs.timezone-dates": doc(
    p("Users in **UTC-8** see due dates one day earlier than they picked."),
    ul(
      "We store midnight local time as UTC",
      "Fix: store dates at noon UTC, like the calendar view already does",
    ),
  ),
  "bugs.slow-dashboard": doc(
    h(3, "Numbers"),
    ul(
      "20 lists: **6.1 s** to interactive",
      "5 lists: 1.4 s",
      "Most of the time is spent in 40 sequential requests",
    ),
    h(3, "Fix"),
    p("Batch the per-list counts into **one query** and stream the charts."),
  ),
  "bugs.memory-leak": doc(
    p("Heap grows by about **40 MB** every time you switch boards quickly."),
    todo(
      "[x] Reproduce with the memory profiler",
      "[x] Found: drag listeners are not removed",
      "[ ] Fix and add a regression check",
    ),
  ),
  "content.sprint-mistakes": doc(
    h(2, "Outline"),
    ol(
      "Planning without capacity",
      "Too many priorities",
      "No definition of done",
      "Skipping the retro",
    ),
    p(
      "**Tone:** practical, with one short story per mistake. Target length 1,500 words.",
    ),
  ),
  "content.newsletter": doc(
    h(3, "Sections"),
    ul(
      "**Feature spotlight:** subtasks and checklists",
      "Customer story: Northwind",
      "Tips: keyboard shortcuts",
    ),
    p("Send on the **first Tuesday** of the month, 9:00 local time."),
  ),
  "launch.landing-page": doc(
    h(2, "Brief"),
    p("One page that explains the Q4 release in **under 30 seconds**."),
    ul(
      "Hero with the product video",
      "Three feature blocks",
      "Pricing teaser and a single call to action",
    ),
    todo(
      "[x] Wireframes",
      "[x] Copy draft",
      "[ ] Final visuals",
      "[ ] Handoff to engineering",
    ),
  ),
  "launch.pricing-page": doc(
    p("Blocked until finance signs off the **new tiers**."),
    ul(
      "Free, Team, Business, Enterprise",
      "Annual discount: 20%",
      "Show a comparison table",
    ),
  ),
  "launch.launch-day": doc(
    p(
      "Everything that must happen on launch day, in order. Owners are on the checklist below.",
    ),
    h(3, "Timeline"),
    ul(
      "**08:00** flip the feature flags",
      "**09:00** publish the blog post and landing page",
      "**10:00** social posts and newsletter",
      "**16:00** metrics check-in",
    ),
  ),
};

// --- Subtasks, checklists, tags --------------------------------------------------------------

type Sub = [
  name: string,
  status: "open" | "active" | "done",
  priority?: Priority,
];

export const DEMO_SUBTASKS: Record<string, Sub[]> = {
  "sprint.sso": [
    ["Register the OAuth client", "done"],
    ["Callback endpoint and account linking", "done", "high"],
    ["Sign in with Google button", "active"],
    ["Enforce SSO setting for admins", "open"],
  ],
  "sprint.board-virtualization": [
    ["Spike: windowed columns", "done"],
    ["Keep drag and drop working", "active", "urgent"],
    ["Profile before and after", "open"],
  ],
  "sprint.search-index": [
    ["Add tsvector column and index", "open", "high"],
    ["Search API endpoint", "open"],
    ["Result ranking", "open"],
    ["Highlight matches", "open", "low"],
    ["Search empty state", "open", "low"],
  ],
  "sprint.billing-webhooks": [
    ["processed_events table", "done"],
    ["Transactional handlers", "active", "high"],
    ["Failure alerts", "open"],
  ],
  "bugs.slow-dashboard": [
    ["Batch list counts query", "active", "urgent"],
    ["Stream charts", "open"],
    ["Add a performance budget check", "open", "low"],
  ],
  "content.newsletter": [
    ["Feature spotlight copy", "done"],
    ["Customer story", "active"],
    ["Tips section", "open"],
    ["Proofread and schedule", "open"],
  ],
  "launch.landing-page": [
    ["Wireframes", "done"],
    ["Copy", "done"],
    ["Visual design", "active", "high"],
    ["Build the page", "open"],
    ["QA on mobile", "open"],
  ],
  "launch.demo-video": [
    ["Script", "done"],
    ["Record voice-over", "active"],
    ["Edit and captions", "open"],
  ],
};

/** Checklist name -> items (`[x] ` = done). */
export const DEMO_CHECKLISTS: Record<string, Record<string, string[]>> = {
  "sprint.release-notes": {
    "Before publishing": [
      "[x] Collect merged PRs",
      "[ ] Screenshots for new features",
      "[ ] Review with product",
      "[ ] Publish to the changelog",
    ],
  },
  "sprint.api-rate-limit": {
    Rollout: [
      "[x] Log-only mode",
      "[x] Dashboard for limit hits",
      "[ ] Email affected workspaces",
      "[ ] Enforce limits",
    ],
  },
  "bugs.safari-drag": {
    "Browsers to verify": [
      "[x] Safari 17 macOS",
      "[ ] Safari iOS",
      "[x] Chrome",
      "[x] Firefox",
    ],
  },
  "launch.launch-day": {
    Morning: [
      "[ ] Flip feature flags",
      "[ ] Publish blog post",
      "[ ] Publish landing page",
    ],
    Afternoon: ["[ ] Social posts", "[ ] Newsletter", "[ ] Metrics check-in"],
  },
  "content.case-study": {
    Assets: [
      "[x] Interview notes",
      "[x] Customer logo approval",
      "[ ] Quote approval",
      "[ ] Final PDF",
    ],
  },
  "launch.press-kit": {
    "Press kit": [
      "[x] Logos",
      "[x] Founder bios",
      "[ ] Product screenshots",
      "[ ] Media list",
    ],
  },
};

export const DEMO_TAGS: Record<string, [name: string, color: string][]> = {
  product: [
    ["frontend", "#2b7fff"],
    ["backend", "#4f39f6"],
    ["bug", "#e7000b"],
    ["design", "#c800de"],
    ["urgent-fix", "#e17100"],
    ["performance", "#009689"],
    ["security", "#007a55"],
  ],
  marketing: [
    ["marketing", "#e17100"],
    ["design", "#c800de"],
    ["content", "#4f39f6"],
    ["social", "#0092b8"],
    ["launch", "#497d00"],
    ["urgent-fix", "#e7000b"],
  ],
};

/** Task key -> tag names (tags come from the task's space). */
export const DEMO_TASK_TAGS: Record<string, string[]> = {
  "sprint.sso": ["backend", "security"],
  "sprint.onboarding-checklist": ["frontend", "design"],
  "sprint.api-rate-limit": ["backend", "urgent-fix"],
  "sprint.csv-export": ["backend"],
  "sprint.dark-mode-charts": ["frontend", "design"],
  "sprint.billing-webhooks": ["backend"],
  "sprint.search-index": ["backend", "performance"],
  "sprint.board-virtualization": ["frontend", "performance"],
  "sprint.audit-log": ["backend", "security"],
  "sprint.mobile-nav": ["frontend", "design"],
  "sprint.flaky-e2e": ["bug"],
  "sprint.design-tokens": ["design", "frontend"],
  "sprint.feature-flags": ["backend"],
  "sprint.invite-modal": ["design"],
  "bugs.safari-drag": ["bug", "frontend", "urgent-fix"],
  "bugs.timezone-dates": ["bug", "backend"],
  "bugs.double-submit": ["bug", "frontend"],
  "bugs.logout-redirect": ["bug"],
  "bugs.slow-dashboard": ["performance", "urgent-fix"],
  "bugs.duplicate-emails": ["bug", "backend"],
  "bugs.dark-contrast": ["design"],
  "bugs.memory-leak": ["bug", "performance"],
  "bugs.pdf-timeout": ["backend", "performance"],
  "bugs.session-expiry": ["security"],
  "content.sprint-mistakes": ["content"],
  "content.case-study": ["content", "marketing"],
  "content.newsletter": ["marketing"],
  "content.carousel": ["social", "design"],
  "content.video-tutorial": ["content"],
  "content.seo-audit": ["marketing"],
  "content.launch-thread": ["social", "launch"],
  "content.onboarding-email": ["marketing", "urgent-fix"],
  "content.comparison-page": ["content", "marketing"],
  "launch.plan": ["launch"],
  "launch.landing-page": ["launch", "design"],
  "launch.pricing-page": ["launch", "urgent-fix"],
  "launch.press-kit": ["marketing"],
  "launch.demo-video": ["launch", "content"],
  "launch.ads-budget": ["marketing"],
  "launch.launch-day": ["launch"],
  "launch.store-screenshots": ["design"],
  "launch.teaser-post": ["social"],
};

// --- Activity ---------------------------------------------------------------------------------

/** Tasks that get a backdated history (3-8 entries each). */
export const DEMO_ACTIVITY_TASKS = [
  "sprint.sso",
  "sprint.api-rate-limit",
  "sprint.billing-webhooks",
  "sprint.board-virtualization",
  "sprint.search-index",
  "sprint.flaky-e2e",
  "sprint.mobile-nav",
  "sprint.design-tokens",
  "bugs.safari-drag",
  "bugs.timezone-dates",
  "bugs.slow-dashboard",
  "bugs.memory-leak",
  "bugs.logout-redirect",
  "content.sprint-mistakes",
  "content.newsletter",
  "content.launch-thread",
  "launch.landing-page",
  "launch.pricing-page",
  "launch.demo-video",
  "launch.launch-day",
  "launch.press-kit",
];

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export type DemoRichRows = ReturnType<typeof buildDemoRichTasks>;

export type BuildDemoRichTasksInput = {
  ownerUserId: string;
  seed: Pick<DemoRows, "tasks" | "statuses" | "idsByKey">;
  /** Fake teammates (in `DEMO_TEAMMATES` order). */
  teammates: { id: string; name: string }[];
  now?: Date;
};

/**
 * Builds the Step 3 rows. Sets `description` on the matching `seed.tasks` rows in place, and
 * returns rows to insert after tasks, users and members: subtasks (Task rows), their assignees,
 * checklists + items, tags + task tags, and activity. Insert order: tasks, subtasks, the rest.
 */
export function buildDemoRichTasks({
  ownerUserId,
  seed,
  teammates,
  now = new Date(),
}: BuildDemoRichTasksInput) {
  const taskByKey = new Map<string, DemoRows["tasks"][number]>();
  for (const [key, id] of seed.idsByKey) {
    const task = seed.tasks.find((t) => t.id === id);
    if (task) taskByKey.set(key, task);
  }
  const need = (key: string) => {
    const task = taskByKey.get(key);
    if (!task)
      throw new Error(`Demo rich content refers to unknown task "${key}"`);
    return task;
  };
  const statusOf = (
    task: { listId: string },
    type: "open" | "active" | "done",
  ) =>
    seed.statuses.find(
      (s) => s.listId === task.listId && s.type === type && s.isDefault,
    )!;
  const statusById = new Map(seed.statuses.map((s) => [s.id, s]));
  const people = [...teammates, { id: ownerUserId, name: "You" }];
  let pick = 0;
  const nextPerson = () => teammates[pick++ % teammates.length]!;

  // Descriptions (in place, so they go in with the tasks' createMany).
  const descriptions = seed.tasks as (DemoRows["tasks"][number] & {
    description?: Node;
  })[];
  for (const [key, description] of Object.entries(DEMO_DESCRIPTIONS)) {
    const task = need(key);
    const row = descriptions.find((t) => t.id === task.id)!;
    row.description = description;
  }

  // Subtasks: Task rows in the parent's list, created shortly after the parent.
  const subtasks: (DemoRows["tasks"][number] & { parentTaskId: string })[] = [];
  const subtaskAssignees: { taskId: string; userId: string }[] = [];
  const subtaskNamesByParent = new Map<string, string[]>();
  for (const [key, subs] of Object.entries(DEMO_SUBTASKS)) {
    const parent = need(key);
    subs.forEach(([name, type, priority], i) => {
      const id = randomUUID();
      subtasks.push({
        id,
        name,
        userId: ownerUserId,
        listId: parent.listId,
        statusId: statusOf(parent, type).id,
        priority: priority ?? "normal",
        startDate: null,
        endDate: parent.endDate,
        createdAt: new Date(parent.createdAt.getTime() + (i + 1) * 17 * MINUTE),
        updatedAt: new Date(parent.createdAt.getTime() + (i + 1) * 17 * MINUTE),
        parentTaskId: parent.id,
      });
      subtaskAssignees.push({ taskId: id, userId: nextPerson().id });
    });
    subtaskNamesByParent.set(
      parent.id,
      subs.map(([name]) => name),
    );
  }

  // Checklists.
  const checklists: {
    id: string;
    taskId: string;
    name: string;
    order: number;
  }[] = [];
  const checklistItems: {
    id: string;
    checklistId: string;
    text: string;
    done: boolean;
    order: number;
    assigneeId: string | null;
  }[] = [];
  const doneItemsByTask = new Map<string, string[]>();
  for (const [key, lists] of Object.entries(DEMO_CHECKLISTS)) {
    const task = need(key);
    Object.entries(lists).forEach(([name, items], order) => {
      const checklistId = randomUUID();
      checklists.push({ id: checklistId, taskId: task.id, name, order });
      items.forEach((item, i) => {
        const done = item.startsWith("[x]");
        const text = item.slice(4);
        checklistItems.push({
          id: randomUUID(),
          checklistId,
          text,
          done,
          order: i,
          assigneeId: i % 2 === 0 ? nextPerson().id : null,
        });
        if (done)
          doneItemsByTask.set(task.id, [
            ...(doneItemsByTask.get(task.id) ?? []),
            text,
          ]);
      });
    });
  }

  // Tags per space; a task uses its own space's tags.
  const workspaceOfList = new Map<string, string>();
  const tags: {
    id: string;
    workspaceId: string;
    name: string;
    color: string;
  }[] = [];
  for (const [spaceKey, spaceTags] of Object.entries(DEMO_TAGS)) {
    const workspaceId = seed.idsByKey.get(spaceKey);
    if (!workspaceId)
      throw new Error(`Demo tags refer to unknown space "${spaceKey}"`);
    for (const [name, color] of spaceTags)
      tags.push({ id: randomUUID(), workspaceId, name, color });
  }
  const spaceOfListKey: Record<string, string> = {
    sprint: "product",
    bugs: "product",
    content: "marketing",
    launch: "marketing",
  };
  for (const [listKey, spaceKey] of Object.entries(spaceOfListKey)) {
    const listId = seed.idsByKey.get(listKey);
    const workspaceId = seed.idsByKey.get(spaceKey);
    if (listId && workspaceId) workspaceOfList.set(listId, workspaceId);
  }
  const taskTags: { taskId: string; tagId: string }[] = [];
  const tagsByTask = new Map<string, { name: string; color: string }[]>();
  for (const [key, names] of Object.entries(DEMO_TASK_TAGS)) {
    const task = need(key);
    const workspaceId = workspaceOfList.get(task.listId);
    for (const name of names) {
      const tag = tags.find(
        (t) => t.workspaceId === workspaceId && t.name === name,
      );
      if (!tag)
        throw new Error(`Demo task "${key}" uses unknown tag "${name}"`);
      taskTags.push({ taskId: task.id, tagId: tag.id });
      tagsByTask.set(task.id, [
        ...(tagsByTask.get(task.id) ?? []),
        { name: tag.name, color: tag.color },
      ]);
    }
  }

  // Backdated activity: created, then a plausible mix of changes, ending at the current state.
  const activities: {
    id: string;
    taskId: string;
    actorId: string;
    type: ActivityType;
    data: Node;
    createdAt: Date;
  }[] = [];
  DEMO_ACTIVITY_TASKS.forEach((key, ti) => {
    const task = need(key);
    const status = statusById.get(task.statusId)!;
    const open = statusOf(task, "open");
    const created = task.createdAt.getTime();
    const span = Math.max(now.getTime() - created - HOUR, 6 * HOUR);
    const entries: { type: ActivityType; data?: Node; actor?: string }[] = [
      { type: "created", actor: ownerUserId },
    ];

    const owner = people[ti % teammates.length]!;
    entries.push({
      type: "assignee_added",
      data: { userId: owner.id, name: owner.name },
    });
    for (const tag of (tagsByTask.get(task.id) ?? []).slice(0, 1))
      entries.push({ type: "tag_added", data: tag });
    if (DEMO_DESCRIPTIONS[key]) entries.push({ type: "description" });
    if (ti % 3 === 0)
      entries.push({
        type: "priority",
        data: { from: "normal", to: task.priority },
      });
    for (const name of (subtaskNamesByParent.get(task.id) ?? []).slice(0, 2))
      entries.push({ type: "subtask_added", data: { name } });
    if (status.id !== open.id)
      entries.push({
        type: "status",
        data: { from: open.name, to: status.name },
      });
    for (const text of (doneItemsByTask.get(task.id) ?? []).slice(0, 2))
      entries.push({ type: "checklist_item_done", data: { text } });
    if (task.endDate && ti % 2 === 1)
      entries.push({
        type: "dates",
        data: {
          startDate: task.startDate?.toISOString() ?? null,
          endDate: task.endDate.toISOString(),
        },
      });

    const kept = entries.slice(0, 8);
    kept.forEach((entry, i) => {
      activities.push({
        id: randomUUID(),
        taskId: task.id,
        actorId: entry.actor ?? teammates[(ti + i) % teammates.length]!.id,
        type: entry.type,
        data: entry.data ?? {},
        createdAt: new Date(
          created + Math.round((span * i) / kept.length) + i * 7 * MINUTE,
        ),
      });
    });
  });

  return {
    subtasks,
    subtaskAssignees,
    checklists,
    checklistItems,
    tags,
    taskTags,
    activities,
  };
}
