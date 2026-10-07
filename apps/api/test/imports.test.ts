import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { csvToImport, guessCsvMapping, parseCsv, trelloToImport, type ImportModel } from "@clickup/shared";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

const sample = (file: string) =>
  readFileSync(fileURLToPath(new URL(`../../web/public/samples/${file}`, import.meta.url)), "utf8");

const payload = ({ warnings: _warnings, ...model }: ImportModel, workspaceId: string) => ({ ...model, workspaceId });
const postImport = (cookie: string, body: object) => api().post("/api/imports").set("Cookie", cookie).send(body);

describe("imports", () => {
  it("creates a list from the sample Trello board with statuses, tags, checklists and assignees", async () => {
    const owner = await signUp();
    const space = await seedWorkspace(owner.cookie);
    const teammate = await signUp({ name: "Maya Chen" });
    await prisma.workspaceMember.create({ data: { workspaceId: space.workspace.id, userId: teammate.user.id, role: "member" } });
    await prisma.tag.create({ data: { workspaceId: space.workspace.id, name: "design", color: "#000000" } });

    const model = trelloToImport(JSON.parse(sample("trello-website-relaunch.json")));
    const res = await postImport(owner.cookie, payload(model, space.workspace.id)).expect(201);
    const { listId } = res.body as { listId: string };
    expect(res.body).toMatchObject({ workspaceId: space.workspace.id, tasksCount: model.tasks.length, statusesCount: 5 });

    const list = await prisma.list.findUniqueOrThrow({
      where: { id: listId },
      include: { status: { orderBy: { order: "asc" } } },
    });
    expect(list.name).toBe("Website Relaunch");
    expect(list.status.map((s) => `${s.name}:${s.type}`)).toEqual([
      "Backlog:open",
      "To Do:active",
      "Doing:active",
      "Review:active",
      "Done:done",
    ]);

    const tasks = await prisma.task.findMany({
      where: { listId },
      include: {
        status: true,
        tags: { include: { tag: true } },
        assignees: true,
        checklists: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
        activities: true,
      },
      orderBy: { createdAt: "asc" },
    });
    expect(tasks).toHaveLength(25); // 28 cards: 2 archived, 1 in an archived list
    const nav = tasks.find((t) => t.name === "New navigation menu")!;
    expect(nav.status.name).toBe("Doing");
    expect(nav.endDate?.toISOString()).toBe("2026-10-10T16:00:00.000Z");
    expect(nav.tags.map((t) => t.tag.name).sort()).toEqual(["design", "frontend"]);
    expect(nav.assignees.map((a) => a.userId)).toEqual([teammate.user.id]); // Liam is not a member
    expect(nav.checklists[0]!.items.map((i) => [i.text, i.done])).toEqual([
      ["Desktop mega menu", true],
      ["Mobile drawer", true],
      ["Keyboard support", false],
    ]);
    expect(nav.description).toMatchObject({ type: "doc", content: [{ type: "paragraph" }] });
    expect(nav.activities).toMatchObject([{ type: "imported", actorId: owner.user.id, data: { source: "Trello" } }]);
    expect(tasks.filter((t) => t.status.type === "done").every((t) => t.completedAt !== null)).toBe(true);
    expect(tasks.filter((t) => t.status.type !== "done").every((t) => t.completedAt === null)).toBe(true);

    // The existing "design" tag is reused, not duplicated.
    const design = await prisma.tag.findMany({ where: { workspaceId: space.workspace.id, name: "design" } });
    expect(design).toHaveLength(1);
    expect(design[0]!.color).toBe("#000000");

    // The new list shows up in the space and its tasks through the regular endpoints.
    const listed = await api().get(`/api/tasks?listId=${listId}`).set("Cookie", owner.cookie).expect(200);
    expect(JSON.stringify(listed.body)).toContain("Hero section animation");
  });

  it("imports the sample CSV and matches assignees by name or email", async () => {
    const owner = await signUp({ name: "Noah Kim" });
    const space = await seedWorkspace(owner.cookie);
    const rows = parseCsv(sample("sample-tasks.csv"));
    const model = csvToImport(rows, guessCsvMapping(rows[0]!), "Product backlog");
    expect(model.warnings).toEqual([]);

    const body = payload(model, space.workspace.id);
    body.tasks[0]!.assignees = [owner.credentials.email.toUpperCase()];
    const res = await postImport(owner.cookie, body).expect(201);
    const tasks = await prisma.task.findMany({
      where: { listId: res.body.listId },
      include: { status: true, assignees: true, tags: { include: { tag: true } } },
      orderBy: { createdAt: "asc" },
    });
    expect(tasks).toHaveLength(20);
    expect(tasks[0]).toMatchObject({ name: "Set up product analytics", priority: "high", points: 5 });
    expect(tasks[0]!.assignees.map((a) => a.userId)).toEqual([owner.user.id]);
    const statuses = await prisma.status.findMany({ where: { listId: res.body.listId }, orderBy: { order: "asc" } });
    expect(statuses.map((s) => `${s.name}:${s.type}`)).toEqual([
      "To do:open",
      "In progress:active",
      "In review:active",
      "Done:done",
    ]);
    expect(tasks.filter((t) => t.assignees.some((a) => a.userId === owner.user.id)).length).toBeGreaterThan(1);
  });

  it("checks membership, role and payload", async () => {
    const owner = await signUp();
    const outsider = await signUp();
    const guest = await signUp();
    const space = await seedWorkspace(owner.cookie);
    await prisma.workspaceMember.create({ data: { workspaceId: space.workspace.id, userId: guest.user.id, role: "guest" } });
    const body = {
      workspaceId: space.workspace.id,
      source: "csv",
      listName: "Mini",
      statuses: [
        { name: "to do", type: "open", color: "neutral" },
        { name: "doing", type: "active", color: "violet" },
        { name: "done", type: "done", color: "emerald" },
      ],
      tasks: [{ name: "Only task", status: "doing", tags: ["new-tag"] }],
    };

    await api().post("/api/imports").send(body).expect(401);
    await postImport(outsider.cookie, body).expect(404);
    await postImport(guest.cookie, body).expect(403);
    await postImport(owner.cookie, { ...body, tasks: [{ name: "x", status: "missing" }] }).expect(422);
    await postImport(owner.cookie, { ...body, statuses: body.statuses.slice(0, 2) }).expect(422);
    await postImport(owner.cookie, { ...body, tasks: Array.from({ length: 1001 }, () => ({ name: "x", status: "done" })) }).expect(422);

    const res = await postImport(owner.cookie, body).expect(201);
    const task = await prisma.task.findFirstOrThrow({ where: { listId: res.body.listId }, include: { tags: { include: { tag: true } } } });
    expect(task.tags[0]!.tag).toMatchObject({ name: "new-tag", color: expect.stringMatching(/^#[0-9a-f]{6}$/) });
    expect(await prisma.list.count({ where: { workspaceId: space.workspace.id } })).toBe(2);
  });
});
