import { describe, expect, it } from "vitest";
import type { Task } from "@/features/task/types";
import type { Assignee } from "@/features/members/types";
import { UNASSIGNED } from "@/features/viewConfig/lib/applyViewConfig";
import {
  buildPeriods,
  buildWorkload,
  cellCapacity,
  loadLevel,
  periodIndex,
  resolveWorkloadDrop,
  shiftTaskDates,
  stepAnchor,
} from "./workload.lib";

const maya: Assignee = { id: "u-maya", name: "Maya Chen", avatarColor: null };
const liam: Assignee = { id: "u-liam", name: "Liam Patel", avatarColor: null };

const open = { type: "open" } as Task["status"];
const done = { type: "done" } as Task["status"];
const task = (id: string, patch: Partial<Task> = {}): Task =>
  ({ id, name: id, status: open, assignees: [], points: null, startDate: null, endDate: null, ...patch }) as Task;

// Wednesday 7 October 2026.
const wed = new Date(2026, 9, 7, 15, 30);
const day = (d: number) => new Date(2026, 9, d, 12);

describe("buildPeriods", () => {
  it("shows the Monday-Sunday week in day mode and six weeks in week mode", () => {
    const days = buildPeriods(wed, "day");
    expect(days).toHaveLength(7);
    expect(days[0]!.start).toEqual(new Date(2026, 9, 5));
    expect(days[6]!.start).toEqual(new Date(2026, 9, 11));
    expect(days[6]!.end).toEqual(new Date(2026, 9, 12));

    const weeks = buildPeriods(wed, "week");
    expect(weeks).toHaveLength(6);
    expect(weeks[1]!.start).toEqual(new Date(2026, 9, 12));
    expect(weeks[5]!.end).toEqual(new Date(2026, 10, 16));
  });

  it("steps one week in day mode and six in week mode", () => {
    expect(stepAnchor(wed, "day", 1).getDate()).toBe(14);
    expect(buildPeriods(stepAnchor(wed, "week", -1), "week")[0]!.start).toEqual(new Date(2026, 7, 24));
  });

  it("finds a date's column", () => {
    const days = buildPeriods(wed, "day");
    expect(periodIndex(day(5), days)).toBe(0);
    expect(periodIndex(new Date(2026, 9, 11, 23, 59), days)).toBe(6);
    expect(periodIndex(day(12), days)).toBe(-1);
  });
});

describe("buildWorkload", () => {
  const periods = buildPeriods(wed, "day");

  it("counts each task on its due date for every assignee, unassigned ones in their own row", () => {
    const rows = buildWorkload(
      [
        task("a", { assignees: [maya, liam], endDate: day(7), startDate: day(5) }),
        task("b", { assignees: [maya], endDate: day(7) }),
        task("c", { endDate: day(8) }),
        task("d", { assignees: [maya] }), // no due date
        task("e", { assignees: [maya], endDate: day(20) }), // outside the week
      ],
      [maya.id, liam.id, UNASSIGNED],
      periods,
      "tasks",
    );
    expect([...rows.keys()]).toEqual([maya.id, liam.id, UNASSIGNED]);
    const m = rows.get(maya.id)!;
    expect(m.cells[2]!.tasks.map((t) => t.id)).toEqual(["a", "b"]);
    expect(m.cells[2]!.load).toBe(2);
    expect(m.cells[0]!.tasks).toEqual([]);
    expect(m.total).toBe(2);
    expect(rows.get(liam.id)!.total).toBe(1);
    expect(rows.get(UNASSIGNED)!.cells[3]!.tasks.map((t) => t.id)).toEqual(["c"]);
  });

  it("sums points, shows done tasks without counting them and skips unknown assignees", () => {
    const rows = buildWorkload(
      [
        task("a", { assignees: [maya], endDate: day(6), points: 3 }),
        task("b", { assignees: [maya], endDate: day(6), points: 5, status: done }),
        task("c", { assignees: [maya], endDate: day(6) }),
        task("d", { assignees: [liam], endDate: day(6), points: 2 }),
      ],
      [maya.id],
      periods,
      "points",
    );
    expect(rows.size).toBe(1);
    expect(rows.get(maya.id)!.cells[1]).toMatchObject({ load: 3 });
    expect(rows.get(maya.id)!.cells[1]!.tasks).toHaveLength(3);
  });
});

describe("capacity", () => {
  it("scales a day's capacity by 5 for a week", () => {
    expect(cellCapacity(3, "day")).toBe(3);
    expect(cellCapacity(3, "week")).toBe(15);
  });

  it("is red over capacity, amber from 80% and green below", () => {
    expect(loadLevel(0, 3)).toBe("empty");
    expect(loadLevel(1, 3)).toBe("under");
    expect(loadLevel(3, 3)).toBe("near");
    expect(loadLevel(7, 8)).toBe("near");
    expect(loadLevel(6, 8)).toBe("under");
    expect(loadLevel(4, 3)).toBe("over");
  });
});

describe("drag and drop", () => {
  const days = buildPeriods(wed, "day");
  const weeks = buildPeriods(wed, "week");

  it("reassigns across rows and shifts dates across columns", () => {
    expect(resolveWorkloadDrop({ rowKey: "a", periodIndex: 2 }, { rowKey: "b", periodIndex: 2 }, days)).toEqual({
      reassign: { from: "a", to: "b" },
      dayDelta: 0,
    });
    expect(resolveWorkloadDrop({ rowKey: "a", periodIndex: 2 }, { rowKey: "a", periodIndex: 4 }, days)).toEqual({
      dayDelta: 2,
    });
    expect(resolveWorkloadDrop({ rowKey: "a", periodIndex: 3 }, { rowKey: "a", periodIndex: 1 }, weeks)).toEqual({
      dayDelta: -14,
    });
  });

  it("ignores drops on nothing or on the same cell", () => {
    expect(resolveWorkloadDrop({ rowKey: "a", periodIndex: 2 }, null, days)).toBeNull();
    expect(resolveWorkloadDrop({ rowKey: "a", periodIndex: 2 }, { rowKey: "a", periodIndex: 2 }, days)).toBeNull();
  });

  it("moves both dates by the same amount, keeping the duration", () => {
    expect(shiftTaskDates({ startDate: day(5), endDate: day(7) }, 3)).toEqual({ startDate: day(8), endDate: day(10) });
    expect(shiftTaskDates({ startDate: null, endDate: day(7) }, -1)).toEqual({ startDate: null, endDate: day(6) });
  });
});
