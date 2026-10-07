import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

type Field = { id: string; name: string; type: string; order: number; config: { options?: { id: string; name: string; color: string }[]; expression?: string } };

async function setup() {
  const a = await signUp();
  const space = await seedWorkspace(a.cookie);
  const task = await createTask(a.cookie, { listId: space.list.id, statusId: space.openStatus.id });
  const create = (body: object, status = 201) =>
    api().post(`/api/lists/${space.list.id}/custom-fields`).set("Cookie", a.cookie).send(body).expect(status);
  const setValue = (fieldId: string, value: unknown, status = 200, taskId = task.id) =>
    api().put(`/api/tasks/${taskId}/custom-fields/${fieldId}`).set("Cookie", a.cookie).send({ value }).expect(status);
  const tasks = async () =>
    (await api().get(`/api/tasks?listId=${space.list.id}`).set("Cookie", a.cookie).expect(200)).body as {
      id: string;
      customFields: Record<string, unknown>;
    }[];
  return { a, space, task, create, setValue, tasks };
}

describe("custom fields", () => {
  it("creates, lists, renames, edits and deletes fields on a list", async () => {
    const { a, space, create } = await setup();
    const severity = (
      await create({
        name: "Severity",
        type: "dropdown",
        config: { options: [{ name: "Low", color: "#1090e0" }, { name: "High", color: "#e50000" }] },
      })
    ).body as Field;
    expect(severity.config.options).toHaveLength(2);
    expect(severity.config.options!.every((o) => o.id.length > 0)).toBe(true);
    const estimate = (await create({ name: "Estimate", type: "number", config: { expression: "ignored" } })).body as Field;
    expect(estimate).toMatchObject({ type: "number", order: 1, config: {} });
    const formula = (await create({ name: "Score", type: "formula", config: { expression: "{Estimate} * 2 + points" } })).body as Field;
    expect(formula.config.expression).toBe("{Estimate} * 2 + points");

    const list = await api().get(`/api/lists/${space.list.id}/custom-fields`).set("Cookie", a.cookie).expect(200);
    expect(list.body.map((f: Field) => f.name)).toEqual(["Severity", "Estimate", "Score"]);

    // Renaming a field rewrites the formulas that reference it.
    await api().patch(`/api/custom-fields/${estimate.id}`).set("Cookie", a.cookie).send({ name: "Estimate (h)" }).expect(200);
    const score = await prisma.customField.findUniqueOrThrow({ where: { id: formula.id } });
    expect(score.config).toEqual({ expression: "{Estimate (h)} * 2 + points" });

    await api().delete(`/api/custom-fields/${severity.id}`).set("Cookie", a.cookie).expect(200);
    const after = await api().get(`/api/lists/${space.list.id}/custom-fields`).set("Cookie", a.cookie).expect(200);
    expect(after.body).toHaveLength(2);
  });

  it("rejects bad formulas, duplicate names, guests and outsiders", async () => {
    const { space, create } = await setup();
    await create({ name: "Notes", type: "text" });
    await create({ name: "Bad", type: "formula", config: { expression: "2 * (" } }, 422);
    await create({ name: "Bad", type: "formula", config: { expression: "{Notes} * 2" } }, 422);
    await create({ name: "Bad", type: "formula", config: { expression: "{Missing} + 1" } }, 422);
    await create({ name: "notes", type: "number" }, 409);
    await create({ name: "Weird", type: "rating" }, 422);

    const guest = await signUp();
    await prisma.workspaceMember.create({ data: { workspaceId: space.workspace.id, userId: guest.user.id, role: "guest" } });
    await api()
      .post(`/api/lists/${space.list.id}/custom-fields`)
      .set("Cookie", guest.cookie)
      .send({ name: "X", type: "text" })
      .expect(403);
    await api().get(`/api/lists/${space.list.id}/custom-fields`).set("Cookie", guest.cookie).expect(200);

    const outsider = await signUp();
    await api().get(`/api/lists/${space.list.id}/custom-fields`).set("Cookie", outsider.cookie).expect(404);
  });

  it("sets, validates and clears values, and includes them in the task payloads", async () => {
    const { a, space, task, create, setValue, tasks } = await setup();
    const field = async (name: string, type: string, config = {}) => ((await create({ name, type, config })).body as Field).id;
    const severity = (
      await create({ name: "Severity", type: "dropdown", config: { options: [{ name: "High", color: "#e50000" }] } })
    ).body as Field;
    const high = severity.config.options![0]!.id;
    const ids = {
      text: await field("Customer", "text"),
      number: await field("Estimate", "number"),
      date: await field("Release", "date"),
      checkbox: await field("QA", "checkbox"),
      people: await field("Reviewer", "people"),
      progress: await field("Progress", "progress"),
      formula: await field("Score", "formula", { expression: "{Estimate} * 2" }),
    };

    await setValue(severity.id, high);
    await setValue(ids.text, "  Acme  ");
    await setValue(ids.number, 4.5);
    await setValue(ids.date, "2026-10-20");
    await setValue(ids.checkbox, true);
    await setValue(ids.people, [a.user.id]);
    await setValue(ids.progress, 40);

    await setValue(severity.id, "nope", 422);
    await setValue(ids.number, "4", 422);
    await setValue(ids.date, "20/10/2026", 422);
    await setValue(ids.progress, 140, 422);
    await setValue(ids.formula, 3, 422);
    const stranger = await signUp();
    await setValue(ids.people, [stranger.user.id], 422);

    const [row] = await tasks();
    expect(row!.customFields).toEqual({
      [severity.id]: high,
      [ids.text]: "Acme",
      [ids.number]: 4.5,
      [ids.date]: "2026-10-20",
      [ids.checkbox]: true,
      [ids.people]: [a.user.id],
      [ids.progress]: 40,
    });

    // Activity: "set Severity to High".
    const activity = await prisma.activity.findFirstOrThrow({ where: { taskId: task.id, type: "custom_field", data: { path: ["field"], equals: "Severity" } } });
    expect(activity.data).toMatchObject({ field: "Severity", to: "High" });
    const detail = await api().get(`/api/tasks/${task.id}`).set("Cookie", a.cookie).expect(200);
    expect(detail.body.customFields[ids.text]).toBe("Acme");

    // Clearing: null, an unchecked box or empty text delete the value.
    await setValue(ids.text, null);
    await setValue(ids.checkbox, false);
    const [cleared] = await tasks();
    expect(cleared!.customFields[ids.text]).toBeUndefined();
    expect(cleared!.customFields[ids.checkbox]).toBeUndefined();
    const before = await prisma.activity.count({ where: { taskId: task.id, type: "custom_field" } });
    await setValue(ids.number, 4.5); // unchanged: no new activity
    expect(await prisma.activity.count({ where: { taskId: task.id, type: "custom_field" } })).toBe(before);

    // Removing a dropdown option clears the values that used it.
    await api()
      .patch(`/api/custom-fields/${severity.id}`)
      .set("Cookie", a.cookie)
      .send({ config: { options: [{ name: "Low", color: "#1090e0" }] } })
      .expect(200);
    const [afterEdit] = await tasks();
    expect(afterEdit!.customFields[severity.id]).toBeUndefined();

    // A field of another list cannot be set on this task; outsiders get 404.
    const other = await seedWorkspace(a.cookie, "Other");
    const foreign = (
      await api().post(`/api/lists/${other.list.id}/custom-fields`).set("Cookie", a.cookie).send({ name: "X", type: "text" }).expect(201)
    ).body as Field;
    await setValue(foreign.id, "x", 404);
    await api().put(`/api/tasks/${task.id}/custom-fields/${ids.text}`).set("Cookie", stranger.cookie).send({ value: "x" }).expect(404);

    // Deleting the task deletes its values.
    await api().delete(`/api/tasks/${task.id}`).set("Cookie", a.cookie).expect(200);
    expect(await prisma.customFieldValue.count({ where: { taskId: task.id } })).toBe(0);
    expect(space.list.id).toBeTruthy();
  });

  it("seeds one field of every type with values and a saved view on the Sprint 14 board", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const cookie = `token=${res.body.token}`;
    const listId = res.body.landingListId as string;
    const fields = (await api().get(`/api/lists/${listId}/custom-fields`).set("Cookie", cookie).expect(200)).body as Field[];
    expect(fields.map((f) => f.type).sort()).toEqual(
      ["checkbox", "date", "dropdown", "formula", "number", "people", "progress", "text"].sort(),
    );
    const severity = fields.find((f) => f.name === "Severity")!;
    expect(severity.config.options!.map((o) => o.name)).toEqual(["Low", "Medium", "High", "Critical"]);
    expect(fields.find((f) => f.type === "formula")!.config.expression).toContain("{Estimate (h)}");

    const tasks = (await api().get(`/api/tasks?listId=${listId}`).set("Cookie", cookie).expect(200)).body as {
      customFields: Record<string, unknown>;
    }[];
    const withSeverity = tasks.filter((t) => t.customFields[severity.id]);
    expect(withSeverity.length).toBeGreaterThan(tasks.length / 2);

    const view = await prisma.savedView.findFirstOrThrow({ where: { listId, name: "High severity, by effort" } });
    expect(view.config).toMatchObject({ sort: { dir: "desc" }, filters: { custom: [{ fieldId: severity.id, op: "is" }] } });
  });
});
