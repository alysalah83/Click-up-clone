import { randomBytes, randomUUID } from "node:crypto";
import { formFieldsSchema, formSubmissionTask, validateFormAnswers, type FormField } from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * The demo "Report a bug" form on the Product space's Bug Tracker, with three bugs that came in
 * through it: their descriptions are the submitted answers and their activity says "submitted via
 * form". Sets those descriptions on `seed.tasks` in place, so it runs before the tasks are written.
 */

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const DEMO_FORM_TITLE = "Report a bug";

export const DEMO_FORM_FIELDS: FormField[] = formFieldsSchema.parse([
  { id: "summary", type: "short_text", label: "Summary", placeholder: "One line about the problem", required: true, mapTo: "name" },
  {
    id: "steps",
    type: "long_text",
    label: "Steps to reproduce",
    placeholder: "1. Go to …\n2. Click on …\n3. See the error",
    required: true,
  },
  {
    id: "severity",
    type: "dropdown",
    label: "Severity",
    placeholder: "How bad is it?",
    required: true,
    options: ["Low", "Medium", "High", "Critical"],
    mapTo: "priority",
  },
  { id: "browser", type: "dropdown", label: "Browser", placeholder: "Select a browser", options: ["Chrome", "Safari", "Firefox", "Edge", "Other"] },
  { id: "email", type: "email", label: "Your email", placeholder: "you@company.com" },
]);

/** Bug Tracker tasks (by key) that were submitted through the form, with their answers. */
const SUBMISSIONS: { task: string; answers: Record<string, string> }[] = [
  {
    task: "bugs.avatar-upload",
    answers: {
      steps: "Open Settings > Profile\nChoose a 2.4 MB PNG as the avatar\nThe upload fails with \"Unsupported file\"",
      severity: "Low",
      browser: "Chrome",
      email: "dana.reyes@example.com",
    },
  },
  {
    task: "bugs.csv-encoding",
    answers: {
      steps: "Name a task \"Café Zürich\" or use any Japanese text\nExport the list as CSV\nOpen the file in Excel: the characters are garbled",
      severity: "Medium",
      browser: "Firefox",
      email: "kenji.sato@example.com",
    },
  },
  {
    task: "bugs.stale-search",
    answers: {
      steps: "Search for \"invoice\"\nClear the search box\nThe old results stay on screen until a reload",
      severity: "Medium",
      browser: "Safari",
      email: "priya.n@example.com",
    },
  },
];

export function buildDemoForms(ownerUserId: string, seed: DemoRows, now = new Date()) {
  const listId = seed.idsByKey.get("bugs");
  const tasks = seed.tasks as (DemoRows["tasks"][number] & { description?: Prisma.InputJsonObject })[];
  const activities: Prisma.ActivityCreateManyInput[] = [];
  if (!listId) return { forms: [], activities };

  const submitted: Date[] = [];
  for (const { task: key, answers } of SUBMISSIONS) {
    const task = tasks.find((t) => t.id === seed.idsByKey.get(key));
    if (!task) throw new Error(`Demo form refers to unknown task "${key}"`);
    const { values, errors } = validateFormAnswers(DEMO_FORM_FIELDS, { ...answers, summary: task.name });
    if (Object.keys(errors).length > 0) throw new Error(`Demo form answers for "${key}" are invalid`);
    task.description = formSubmissionTask({ title: DEMO_FORM_TITLE, fields: DEMO_FORM_FIELDS }, values)
      .description as Prisma.InputJsonObject;
    submitted.push(task.createdAt);
    activities.push(
      { id: randomUUID(), taskId: task.id, actorId: ownerUserId, type: "created", data: {}, createdAt: task.createdAt },
      {
        id: randomUUID(),
        taskId: task.id,
        actorId: ownerUserId,
        type: "submitted_via_form",
        data: { name: DEMO_FORM_TITLE },
        createdAt: new Date(task.createdAt.getTime() + 1000),
      },
    );
  }

  const first = Math.min(...submitted.map((d) => d.getTime()));
  const createdAt = new Date(Math.min(first - DAY, now.getTime() - DAY));
  const forms: Prisma.FormCreateManyInput[] = [
    {
      id: randomUUID(),
      listId,
      createdById: ownerUserId,
      title: DEMO_FORM_TITLE,
      description:
        "Found something broken? Tell the product team. Every response becomes a task in the Bug Tracker, and we triage new reports daily.",
      // Same format as newFormSlug in form.service.ts.
      slug: randomBytes(16).toString("base64url"),
      isActive: true,
      fields: DEMO_FORM_FIELDS as Prisma.InputJsonArray,
      submissionCount: submitted.length,
      lastSubmittedAt: new Date(Math.max(...submitted.map((d) => d.getTime()))),
      createdAt,
      updatedAt: createdAt,
    },
  ];
  return { forms, activities };
}
