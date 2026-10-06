import { randomUUID } from "node:crypto";
import type { DemoRows } from "./demoWorkspace.js";

/** Tiptap JSON builders, so the demo docs read like content instead of nested literals. */
type Node = Record<string, unknown>;
const text = (value: string, marks?: string[]): Node => ({
  type: "text",
  text: value,
  ...(marks ? { marks: marks.map((type) => ({ type })) } : {}),
});
const inline = (value: string | Node[]): Node[] => (typeof value === "string" ? [text(value)] : value);
const p = (value: string | Node[]): Node => ({ type: "paragraph", content: inline(value) });
const h = (level: 2 | 3, value: string): Node => ({ type: "heading", attrs: { level }, content: [text(value)] });
const li = (value: string | Node[]): Node => ({ type: "listItem", content: [p(value)] });
const ul = (...items: (string | Node[])[]): Node => ({ type: "bulletList", content: items.map(li) });
const ol = (...items: (string | Node[])[]): Node => ({ type: "orderedList", content: items.map(li) });
const tasks = (...items: [checked: boolean, label: string][]): Node => ({
  type: "taskList",
  content: items.map(([checked, label]) => ({ type: "taskItem", attrs: { checked }, content: [p(label)] })),
});
const code = (value: string): Node => ({ type: "codeBlock", content: [text(value)] });
const doc = (...content: Node[]) => JSON.stringify({ type: "doc", content });

interface DemoDoc {
  key: string;
  space: string;
  parent?: string;
  icon: string;
  title: string;
  content: string;
}

const DEMO_DOCS: DemoDoc[] = [
  {
    key: "roadmap",
    space: "product",
    icon: "🗺️",
    title: "Product roadmap Q4",
    content: doc(
      p([text("Where the product team is heading this quarter. Reviewed every other Monday; "), text("ask in #product", ["bold"]), text(" before changing priorities.")]),
      h(2, "Themes"),
      ul(
        [text("Collaboration: ", ["bold"]), text("comments, mentions and a real inbox")],
        [text("Planning: ", ["bold"]), text("timeline view and task dependencies")],
        [text("Automation: ", ["bold"]), text("rules that remove repetitive status changes")],
      ),
      h(2, "Milestones"),
      tasks(
        [true, "Ship the new task panel"],
        [true, "Launch comments and @mentions"],
        [false, "Timeline view beta with dependency arrows"],
        [false, "Automations GA"],
        [false, "Public API preview"],
      ),
      h(3, "Risks"),
      ol("Data migration for existing workspaces", "Mobile layout still needs a polish pass", "Only one engineer on automations"),
      p("Questions or blockers go into the active sprint list so they are visible to everyone."),
    ),
  },
  {
    key: "meetings",
    space: "product",
    icon: "📝",
    title: "Meeting notes",
    content: doc(
      p("A running log of team syncs. Newest first, one sub-page per meeting."),
      h(2, "Weekly sync: decisions"),
      ul("Keep the board as the default view for new lists", "Move the release from Thursday to Friday", "Design reviews happen async in comments"),
      h(3, "Action items"),
      tasks([true, "Update the release checklist"], [false, "Draft the changelog"], [false, "Book the retro"]),
    ),
  },
  {
    key: "meeting-retro",
    space: "product",
    parent: "meetings",
    icon: "🔁",
    title: "Sprint 14 retro",
    content: doc(
      h(2, "What went well"),
      ul("Shipped the task panel two days early", "Fewer bugs reopened than last sprint"),
      h(2, "What to improve"),
      ul("Estimates for the timeline work were too optimistic", "Too many tasks started and not finished"),
      h(2, "Next sprint"),
      p("Limit work in progress to two tasks per person and review the board every morning."),
    ),
  },
  {
    key: "onboarding",
    space: "product",
    icon: "👋",
    title: "Onboarding guide",
    content: doc(
      p("Welcome to the team. This page gets you productive in your first week."),
      h(2, "Day one"),
      tasks([false, "Get access to the repository"], [false, "Run the app locally"], [false, "Introduce yourself in the team channel"]),
      h(2, "Run it locally"),
      code("pnpm install\npnpm --filter @clickup/api db:local\npnpm --filter @clickup/api dev\npnpm --filter @clickup/web dev"),
      h(2, "Who to ask"),
      ul("Product questions: the product lead", "Infrastructure: whoever is on call this week", "Everything else: just ask, no question is too small"),
    ),
  },
  {
    key: "campaign",
    space: "marketing",
    icon: "🚀",
    title: "Q4 launch plan",
    content: doc(
      p("The plan for the Q4 launch: audience, channels and timeline."),
      h(2, "Goals"),
      ul("10,000 visits to the launch page in two weeks", "500 signups from the webinar", "Three customer stories published"),
      h(2, "Timeline"),
      ol("Teaser posts (week 1)", "Launch day email and blog post (week 2)", "Webinar and follow-up nurture emails (weeks 3 and 4)"),
      h(3, "Checklist"),
      tasks([true, "Landing page copy approved"], [true, "Email templates built"], [false, "Webinar speakers confirmed"], [false, "Paid social budget signed off"]),
    ),
  },
  {
    key: "brand",
    space: "marketing",
    icon: "🎨",
    title: "Brand voice guide",
    content: doc(
      p("How we sound in everything we publish."),
      h(2, "Principles"),
      ul([text("Clear: ", ["bold"]), text("short sentences, no jargon")], [text("Friendly: ", ["bold"]), text("write like you talk to a colleague")], [text("Honest: ", ["bold"]), text("never promise what we cannot ship")]),
      h(2, "Do and don't"),
      ul("Do say \"Create a task\"", "Don't say \"Leverage our task creation functionality\""),
      p([text("Use "), text("sentence case", ["code"]), text(" for headings and buttons.")]),
    ),
  },
  {
    key: "content-ideas",
    space: "marketing",
    icon: "💡",
    title: "Content ideas backlog",
    content: doc(
      p("Raw ideas for blog posts, videos and newsletters. Pick from the top when the calendar has a gap."),
      tasks([false, "How we plan a sprint in 30 minutes"], [false, "Customer story: a 12-person agency"], [true, "Five automations every team should try"], [false, "Short video: keyboard shortcuts tour"]),
    ),
  },
];

/** A few nice pages per demo space, nested where it makes sense. Keys match the demo template. */
export function buildDemoDocs(ownerUserId: string, seed: Pick<DemoRows, "idsByKey">) {
  const ids = new Map(DEMO_DOCS.map((d) => [d.key, randomUUID()]));
  const now = Date.now();
  return DEMO_DOCS.flatMap((d, index) => {
    const workspaceId = seed.idsByKey.get(d.space);
    if (!workspaceId) return [];
    // Staggered timestamps keep the sidebar order stable (it sorts by createdAt).
    const createdAt = new Date(now - (DEMO_DOCS.length - index) * 60_000);
    return [
      {
        id: ids.get(d.key)!,
        workspaceId,
        parentId: d.parent ? (ids.get(d.parent) ?? null) : null,
        title: d.title,
        icon: d.icon,
        content: d.content,
        createdById: ownerUserId,
        createdAt,
        updatedAt: createdAt,
      },
    ];
  });
}
