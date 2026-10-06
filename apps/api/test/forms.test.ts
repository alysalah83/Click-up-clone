import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { seedGuest } from "../src/services/user.service.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

type FormJson = {
  id: string;
  listId: string;
  title: string;
  slug: string;
  isActive: boolean;
  statusId: string | null;
  fields: { id: string; type: string; label: string; required: boolean; options: string[]; mapTo: string }[];
  submissionCount: number;
  lastSubmittedAt: string | null;
};

const BUG_FIELDS = [
  { id: "summary", type: "short_text", label: "Summary", required: true, mapTo: "name" },
  { id: "steps", type: "long_text", label: "Steps to reproduce" },
  { id: "severity", type: "dropdown", label: "Severity", options: ["Low", "Medium", "High", "Critical"], mapTo: "priority", required: true },
  { id: "due", type: "date", label: "Needed by", mapTo: "due_date" },
  { id: "email", type: "email", label: "Your email" },
];

async function bugForm() {
  const owner = await signUp();
  const outsider = await signUp();
  const space = await seedWorkspace(owner.cookie);
  const created = await api().post(`/api/lists/${space.list.id}/forms`).set("Cookie", owner.cookie).send({}).expect(201);
  const form = (
    await api()
      .patch(`/api/forms/${created.body.id}`)
      .set("Cookie", owner.cookie)
      .send({ title: "Bug report", description: "Tell us", fields: BUG_FIELDS })
      .expect(200)
  ).body as FormJson;
  return { owner, outsider, space, form };
}

const submit = (slug: string, body: Record<string, unknown>, ip = "203.0.113.1") =>
  api().post(`/api/public/forms/${slug}/submissions`).set("X-Client-Ip", ip).send(body);

describe("forms", () => {
  it("creates a form with default fields and a private 22-character link, members only", async () => {
    const owner = await signUp();
    const outsider = await signUp();
    const space = await seedWorkspace(owner.cookie);

    await api().post(`/api/lists/${space.list.id}/forms`).set("Cookie", outsider.cookie).send({}).expect(404);
    await api().post(`/api/lists/${space.list.id}/forms`).send({}).expect(401);
    const res = await api().post(`/api/lists/${space.list.id}/forms`).set("Cookie", owner.cookie).send({}).expect(201);
    const form = res.body as FormJson;
    expect(form).toMatchObject({ listId: space.list.id, title: "Sprint 1 form", isActive: true, submissionCount: 0 });
    expect(form.slug).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(form.fields.map((f) => f.mapTo)).toEqual(["name", "description"]);

    const listed = await api().get(`/api/lists/${space.list.id}/forms`).set("Cookie", owner.cookie).expect(200);
    expect(listed.body.map((f: FormJson) => f.id)).toEqual([form.id]);
    await api().get(`/api/lists/${space.list.id}/forms`).set("Cookie", outsider.cookie).expect(404);
    await api().patch(`/api/forms/${form.id}`).set("Cookie", outsider.cookie).send({ title: "x" }).expect(404);
    await api().delete(`/api/forms/${form.id}`).set("Cookie", outsider.cookie).expect(404);
  });

  it("validates fields, status, assignee and tags on update", async () => {
    const { owner, form } = await bugForm();
    const other = await seedWorkspace(owner.cookie, "Other");
    const patch = (body: Record<string, unknown>) =>
      api().patch(`/api/forms/${form.id}`).set("Cookie", owner.cookie).send(body);

    expect(form.fields).toHaveLength(5);
    await patch({ fields: BUG_FIELDS.map((f) => ({ ...f, mapTo: "description" })) }).expect(422);
    await patch({ fields: [...BUG_FIELDS, { id: "x", type: "number", label: "X", mapTo: "due_date" }] }).expect(422);
    await patch({ fields: [] }).expect(422);
    await patch({}).expect(422);
    await patch({ statusId: other.openStatus.id }).expect(422);
    await patch({ assigneeId: (await signUp()).user.id }).expect(422);
    const foreignTag = await api().post(`/api/workspaces/${other.workspace.id}/tags`).set("Cookie", owner.cookie).send({ name: "x", color: "red" }).expect(201);
    await patch({ tagIds: [foreignTag.body.id] }).expect(422);

    const updated = await patch({ isActive: false, priority: "low" }).expect(200);
    expect(updated.body).toMatchObject({ isActive: false, priority: "low" });
    await api().delete(`/api/forms/${form.id}`).set("Cookie", owner.cookie).expect(200);
    expect(await prisma.form.count()).toBe(0);
  });

  it("serves the public form without login, hiding internal ids and mappings", async () => {
    const { owner, form } = await bugForm();
    const res = await api().get(`/api/public/forms/${form.slug}`).expect(200);
    expect(res.body).toEqual({
      slug: form.slug,
      title: "Bug report",
      description: "Tell us",
      fields: [
        { id: "summary", type: "short_text", label: "Summary", placeholder: "", required: true, options: [] },
        { id: "steps", type: "long_text", label: "Steps to reproduce", placeholder: "", required: false, options: [] },
        { id: "severity", type: "dropdown", label: "Severity", placeholder: "", required: true, options: ["Low", "Medium", "High", "Critical"] },
        { id: "due", type: "date", label: "Needed by", placeholder: "", required: false, options: [] },
        { id: "email", type: "email", label: "Your email", placeholder: "", required: false, options: [] },
      ],
    });
    await api().get("/api/public/forms/doesNotExistAtAll123").expect(404);
    await api().get("/api/public/forms/bad").expect(422);

    await api().patch(`/api/forms/${form.id}`).set("Cookie", owner.cookie).send({ isActive: false }).expect(200);
    await api().get(`/api/public/forms/${form.slug}`).expect(404);
    await submit(form.slug, { answers: { summary: "x", severity: "Low" } }).expect(404);
  });

  it("turns a submission into a task through the normal creation path", async () => {
    const { owner, space, form } = await bugForm();
    const teammate = await signUp();
    await prisma.workspaceMember.create({ data: { workspaceId: space.workspace.id, userId: teammate.user.id, role: "member" } });
    const tag = await api().post(`/api/workspaces/${space.workspace.id}/tags`).set("Cookie", owner.cookie).send({ name: "from-form", color: "red" }).expect(201);
    await api()
      .patch(`/api/forms/${form.id}`)
      .set("Cookie", owner.cookie)
      .send({ assigneeId: teammate.user.id, tagIds: [tag.body.id] })
      .expect(200);

    const bad = await submit(form.slug, { answers: { severity: "Huge", email: "nope" } }).expect(422);
    expect(Object.keys(bad.body.error.errors.fieldErrors).sort()).toEqual(
      ["email", "severity", "summary"],
    );

    await submit(form.slug, {
      answers: { summary: "  Crash on save ", steps: "Open a task\nClick save", severity: "Critical", due: "2026-11-02", email: "ana@example.com" },
    }).expect(201);

    const task = await prisma.task.findFirstOrThrow({
      where: { listId: space.list.id },
      include: { assignees: true, tags: true, activities: { orderBy: { createdAt: "asc" } } },
    });
    expect(task).toMatchObject({
      name: "Crash on save",
      priority: "urgent",
      statusId: space.openStatus.id,
      userId: owner.user.id,
    });
    expect(task.endDate?.toISOString()).toBe("2026-11-02T12:00:00.000Z");
    expect(JSON.stringify(task.description)).toContain("Steps to reproduce:");
    expect(JSON.stringify(task.description)).toContain("ana@example.com");
    expect(task.assignees.map((a) => a.userId)).toEqual([teammate.user.id]);
    expect(task.tags.map((t) => t.tagId)).toEqual([tag.body.id]);
    expect(task.activities.map((a) => a.type)).toEqual(expect.arrayContaining(["created", "submitted_via_form"]));
    expect(task.activities.find((a) => a.type === "submitted_via_form")?.data).toEqual({ name: "Bug report" });

    const after = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
    expect(after.submissionCount).toBe(1);
    expect(after.lastSubmittedAt).not.toBeNull();
  });

  it("drops honeypot submissions and rate-limits each visitor", async () => {
    const { space, form } = await bugForm();
    const answers = { summary: "Bot", severity: "Low" };
    await submit(form.slug, { answers, website: "http://spam.example" }, "198.51.100.7").expect(201);
    expect(await prisma.task.count({ where: { listId: space.list.id } })).toBe(0);

    for (let i = 0; i < 4; i++) await submit(form.slug, { answers }, "198.51.100.7").expect(201);
    await submit(form.slug, { answers }, "198.51.100.7").expect(429);
    await submit(form.slug, { answers }, "198.51.100.8").expect(201);
    expect(await prisma.task.count({ where: { listId: space.list.id } })).toBe(5);
  });

  it("seeds the Report a bug form on the Bug Tracker with three submitted bugs", async () => {
    const { user } = await seedGuest();
    const form = await prisma.form.findFirstOrThrow({ where: { createdById: user.id }, include: { list: true } });
    expect(form).toMatchObject({ title: "Report a bug", isActive: true, submissionCount: 3 });
    expect(form.list.name).toBe("Bug Tracker");
    expect(form.lastSubmittedAt).not.toBeNull();
    const submitted = await prisma.activity.findMany({ where: { type: "submitted_via_form", task: { listId: form.listId } } });
    expect(submitted).toHaveLength(3);

    const res = await api().get(`/api/public/forms/${form.slug}`).expect(200);
    expect(res.body.fields.map((f: { label: string }) => f.label)).toEqual([
      "Summary",
      "Steps to reproduce",
      "Severity",
      "Browser",
      "Your email",
    ]);
  });
});
