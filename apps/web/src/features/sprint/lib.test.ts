import { describe, expect, it } from "vitest";
import type { List } from "@/features/list/types";
import { daysLeft, isSprintList, splitSprintLists, sprintRange, sumPoints } from "./lib";

const list = (id: string, sprintNumber?: number): List => ({
  id,
  name: id,
  createdAt: new Date(),
  updatedAt: new Date(),
  workspaceId: "w",
  userId: "u",
  ...(sprintNumber !== undefined && {
    sprintNumber,
    sprintStart: "2026-10-01T12:00:00.000Z",
    sprintEnd: "2026-10-14T12:00:00.000Z",
    sprintState: "active" as const,
  }),
});

describe("sprint lib", () => {
  it("formats the sprint range", () => {
    expect(sprintRange("2026-10-01T12:00:00.000Z", "2026-10-14T12:00:00.000Z")).toBe("Oct 1 – Oct 14");
  });

  it("splits sprint lists out of a space, ordered by number", () => {
    const { sprints, others } = splitSprintLists([list("s14", 14), list("bugs"), list("s13", 13)]);
    expect(sprints.map((s) => s.id)).toEqual(["s13", "s14"]);
    expect(others.map((l) => l.id)).toEqual(["bugs"]);
    expect(isSprintList(list("bugs"))).toBe(false);
  });

  it("counts days left and sums points", () => {
    expect(daysLeft("2026-10-14T12:00:00.000Z", new Date(2026, 9, 6, 9))).toBe(8);
    expect(daysLeft("2026-10-06T12:00:00.000Z", new Date(2026, 9, 6, 23))).toBe(0);
    expect(sumPoints([{ points: 3 }, { points: null }, {}, { points: 5 }])).toBe(8);
  });
});
