import { describe, expect, it } from "vitest";
import {
  createTaskSchema,
  createWorkspaceFlowSchema,
  tasksQuerySchema,
  updateTaskSchema,
  updateWorkspaceSchema,
} from "./index.js";

const id = "3f2b8a4e-9c1d-4e2f-8a6b-1c2d3e4f5a6b";

describe("createTaskSchema", () => {
  it("trims the name, defaults priority to none and coerces ISO dates", () => {
    expect(
      createTaskSchema.parse({
        name: "  Ship it ",
        listId: id,
        statusId: id,
        startDate: "2026-09-28T00:00:00.000Z",
        endDate: null,
      }),
    ).toEqual({
      name: "Ship it",
      listId: id,
      statusId: id,
      priority: "none",
      startDate: new Date("2026-09-28T00:00:00.000Z"),
      endDate: null,
    });
  });

  it("rejects names longer than 128 characters and unknown priorities", () => {
    expect(createTaskSchema.safeParse({ name: "x".repeat(129), listId: id, statusId: id }).success).toBe(false);
    expect(createTaskSchema.safeParse({ name: "a", listId: id, statusId: id, priority: "p0" }).success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("strips fields that must never be client-controlled", () => {
    expect(updateTaskSchema.parse({ name: "a", userId: id, listId: id, id })).toEqual({ name: "a" });
  });
});

describe("updateWorkspaceSchema", () => {
  it("strips userId and avatarId (mass assignment)", () => {
    expect(updateWorkspaceSchema.parse({ name: "A", userId: id, avatarId: id })).toEqual({ name: "A" });
  });
});

describe("createWorkspaceFlowSchema", () => {
  it("drops a smuggled userId from nested objects", () => {
    const parsed = createWorkspaceFlowSchema.parse({
      data: {
        workspace: { name: "Eng", avatar: { icon: "circleDotted", color: "violet" } },
        list: { name: "Sprint", userId: id },
        status: { name: "review", icon: "inProgress", iconColor: "sky", bgColor: "sky" },
        task: { name: "First", userId: id },
      },
    });
    expect(parsed.data.list).toEqual({ name: "Sprint" });
    expect(parsed.data.task).toEqual({ name: "First", priority: "none" });
  });
});

describe("tasksQuerySchema", () => {
  it("treats empty sort values as absent and applies the default limit", () => {
    expect(tasksQuerySchema.parse({ listId: id, status: "", createdAt: "asc" })).toEqual({
      listId: id,
      createdAt: "asc",
      limit: 500,
    });
  });

  it("caps limit at 1000", () => {
    expect(tasksQuerySchema.safeParse({ limit: "5000" }).success).toBe(false);
  });
});
