import { describe, expect, it } from "vitest";
import { dueDateFromOffset, dueOffsetDays, taskTemplateSnapshotSchema } from "./taskTemplate.js";

describe("taskTemplateSnapshotSchema", () => {
  it("fills defaults and normalizes tag names", () => {
    const snapshot = taskTemplateSnapshotSchema.parse({ name: " Bug ", tags: [{ name: "Bug", color: "#e7000b" }] });
    expect(snapshot).toEqual({
      name: "Bug",
      description: null,
      priority: "none",
      points: null,
      tags: [{ name: "bug", color: "#e7000b" }],
      dueInDays: null,
      subtasks: [],
      checklists: [],
    });
  });

  it("rejects a non-doc description and empty checklist items", () => {
    expect(taskTemplateSnapshotSchema.safeParse({ name: "x", description: { type: "p" } }).success).toBe(false);
    expect(
      taskTemplateSnapshotSchema.safeParse({ name: "x", checklists: [{ name: "Triage", items: [" "] }] }).success,
    ).toBe(false);
  });
});

describe("relative due dates", () => {
  it("counts whole UTC days from creation to due", () => {
    const created = new Date("2026-10-06T22:30:00Z");
    expect(dueOffsetDays(created, new Date("2026-10-09T12:00:00Z"))).toBe(3);
    expect(dueOffsetDays(created, new Date("2026-10-06T12:00:00Z"))).toBe(0);
    expect(dueOffsetDays(created, new Date("2026-10-01T12:00:00Z"))).toBeNull();
    expect(dueOffsetDays(created, null)).toBeNull();
  });

  it("puts the due date at noon UTC N days later", () => {
    expect(dueDateFromOffset(new Date("2026-10-06T23:59:00Z"), 1).toISOString()).toBe("2026-10-07T12:00:00.000Z");
  });
});
