import { randomUUID } from "node:crypto";
import { taskTemplateSnapshotSchema, type TaskTemplateSnapshot } from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import type { DemoRows } from "./demoWorkspace.js";
import { tiptap } from "./demoRichTasks.js";

/**
 * Demo task templates in the Product space (the picker lists templates of every space, so they
 * also work in Marketing lists): Bug report, Feature and Meeting notes.
 */

const { h, p, ul, ol, todo, doc } = tiptap;
const HOUR = 60 * 60 * 1000;

interface DemoTemplate {
  name: string;
  description: string;
  snapshot: Omit<Partial<TaskTemplateSnapshot>, "name"> & { name: string };
}

export const DEMO_TASK_TEMPLATES: DemoTemplate[] = [
  {
    name: "Bug report",
    description: "Reproduction steps, expected vs actual, and a triage checklist.",
    snapshot: {
      name: "Bug report",
      priority: "high",
      tags: [{ name: "bug", color: "#e7000b" }],
      description: doc(
        h(3, "Steps to reproduce"),
        ol("Go to …", "Click on …", "See the error"),
        h(3, "Expected"),
        p("What should have happened."),
        h(3, "Actual"),
        p("What happened instead. Add a screenshot or a screen recording if you can."),
        h(3, "Environment"),
        ul("**Browser:** ", "**OS:** ", "**App version:** "),
      ) as TaskTemplateSnapshot["description"],
      checklists: [{ name: "Triage", items: ["Reproduce", "Add logs", "Assign owner", "Link to sprint"] }],
      subtasks: [
        { name: "Write failing test", priority: "high" },
        { name: "Fix", priority: "high" },
        { name: "Verify on staging", priority: "normal" },
      ],
    },
  },
  {
    name: "Feature",
    description: "Problem, proposal and acceptance criteria, broken into design, API, UI and docs.",
    snapshot: {
      name: "New feature",
      priority: "normal",
      points: 5,
      description: doc(
        h(3, "Problem"),
        p("Who is blocked today, and what does it cost them?"),
        h(3, "Proposal"),
        p("The smallest change that solves the problem. Link designs and docs here."),
        h(3, "Acceptance criteria"),
        todo("[ ] ", "[ ] ", "[ ] "),
      ) as TaskTemplateSnapshot["description"],
      subtasks: [
        { name: "Design", priority: "normal" },
        { name: "Build API", priority: "normal" },
        { name: "Build UI", priority: "normal" },
        { name: "Write docs", priority: "low" },
      ],
      checklists: [
        {
          name: "Definition of done",
          items: ["Code reviewed", "Tests pass in CI", "Docs updated", "Shipped behind a feature flag", "Product sign-off"],
        },
      ],
    },
  },
  {
    name: "Meeting notes",
    description: "Agenda, notes, decisions and action items, due the day after the meeting.",
    snapshot: {
      name: "Meeting notes",
      dueInDays: 1,
      description: doc(
        h(3, "Agenda"),
        ul("", ""),
        h(3, "Notes"),
        p(""),
        h(3, "Decisions"),
        ul(""),
        h(3, "Action items"),
        todo("[ ] "),
      ) as TaskTemplateSnapshot["description"],
      checklists: [
        { name: "Before the meeting", items: ["Share the agenda", "Invite attendees", "Add the call link"] },
        { name: "After the meeting", items: ["Send the notes", "Create tasks for action items", "Schedule the follow-up"] },
      ],
    },
  },
];

export function buildDemoTaskTemplates(
  ownerUserId: string,
  seed: Pick<DemoRows, "idsByKey">,
  now = new Date(),
  newId: () => string = randomUUID,
) {
  const workspaceId = seed.idsByKey.get("product");
  if (!workspaceId) return [];
  return DEMO_TASK_TEMPLATES.map((t, i) => {
    const createdAt = new Date(now.getTime() - (9 - i * 2) * 24 * HOUR);
    return {
      id: newId(),
      workspaceId,
      name: t.name,
      description: t.description,
      snapshot: taskTemplateSnapshotSchema.parse(t.snapshot) as Prisma.InputJsonObject,
      createdById: ownerUserId,
      createdAt,
      updatedAt: createdAt,
    };
  });
}
