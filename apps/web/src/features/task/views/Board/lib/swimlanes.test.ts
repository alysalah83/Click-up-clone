import { describe, expect, it } from "vitest";
import type { Task } from "@/features/task/types";
import type { Assignee } from "@/features/members/types";
import { UNASSIGNED } from "@/features/viewConfig/lib/applyViewConfig";
import { buildLanes, cellId, dropExceedsWip, laneCardId, moveAssignee, resolveBoardDrop, wipState } from "./swimlanes";

const maya: Assignee = { id: "u-maya", name: "Maya Chen", avatarColor: null };
const omar: Assignee = { id: "u-omar", name: "Omar Haddad", avatarColor: null };
const ana: Assignee = { id: "u-ana", name: "Ana Ruiz", avatarColor: null };

const task = (id: string, patch: Partial<Task> = {}): Task =>
  ({ id, name: id, statusId: "s1", priority: "none", assignees: [], points: null, ...patch }) as Task;

describe("buildLanes", () => {
  it("puts a task in every assignee's lane, named lanes alphabetically and Unassigned last", () => {
    const lanes = buildLanes(
      [
        task("a", { assignees: [omar, maya], points: 3 }),
        task("b"),
        task("c", { assignees: [maya], points: 2 }),
        task("d", { assignees: [ana] }),
      ],
      "assignee",
    );
    expect(lanes.map((l) => l.label)).toEqual(["Ana Ruiz", "Maya Chen", "Omar Haddad", "Unassigned"]);
    const mayaLane = lanes.find((l) => l.key === maya.id)!;
    expect(mayaLane.tasks.map((t) => t.id)).toEqual(["a", "c"]);
    expect(mayaLane.points).toBe(5);
    expect(mayaLane.assignee).toEqual(maya);
    expect(lanes.at(-1)?.key).toBe(UNASSIGNED);
    expect(lanes.at(-1)?.assignee).toBeUndefined();
  });

  it("orders priority lanes urgent → low with No priority last, only for priorities in use", () => {
    const lanes = buildLanes(
      [task("a", { priority: "low" }), task("b"), task("c", { priority: "urgent" }), task("d", { priority: "low" })],
      "priority",
    );
    expect(lanes.map((l) => [l.key, l.label, l.tasks.length])).toEqual([
      ["urgent", "Urgent", 1],
      ["low", "Low", 2],
      ["none", "No priority", 1],
    ]);
  });

  it("returns no lanes for no tasks", () => {
    expect(buildLanes([], "assignee")).toEqual([]);
  });
});

describe("resolveBoardDrop", () => {
  it("ignores drops on nothing or back on the same cell", () => {
    expect(resolveBoardDrop({ statusId: "s1" }, null)).toBeNull();
    expect(resolveBoardDrop({ statusId: "s1" }, { statusId: "s1" })).toBeNull();
    expect(resolveBoardDrop({ statusId: "s1", laneKey: "x" }, { statusId: "s1", laneKey: "x" })).toBeNull();
  });

  it("changes status on a plain board and within a lane", () => {
    expect(resolveBoardDrop({ statusId: "s1" }, { statusId: "s2" })).toEqual({ statusId: "s2" });
    expect(resolveBoardDrop({ statusId: "s1", laneKey: "x" }, { statusId: "s2", laneKey: "x" })).toEqual({ statusId: "s2" });
  });

  it("changes the lane (and status) across lanes", () => {
    expect(resolveBoardDrop({ statusId: "s1", laneKey: "x" }, { statusId: "s1", laneKey: "y" })).toEqual({
      lane: { from: "x", to: "y" },
    });
    expect(resolveBoardDrop({ statusId: "s1", laneKey: "x" }, { statusId: "s3", laneKey: "y" })).toEqual({
      statusId: "s3",
      lane: { from: "x", to: "y" },
    });
  });
});

describe("moveAssignee", () => {
  it("replaces the old lane's person with the new one, keeping co-assignees", () => {
    expect(moveAssignee([maya, omar], maya.id, ana)).toEqual([omar, ana]);
  });
  it("does not duplicate someone already assigned", () => {
    expect(moveAssignee([maya, omar], maya.id, omar)).toEqual([omar]);
  });
  it("handles the Unassigned lane on both ends", () => {
    expect(moveAssignee([maya], maya.id, null)).toEqual([]);
    expect(moveAssignee([], UNASSIGNED, maya)).toEqual([maya]);
  });
});

describe("WIP limits", () => {
  it("classifies a column against its limit", () => {
    expect(wipState(5, null)).toBe("none");
    expect(wipState(5, undefined)).toBe("none");
    expect(wipState(2, 4)).toBe("ok");
    expect(wipState(4, 4)).toBe("full");
    expect(wipState(5, 4)).toBe("exceeded");
  });
  it("warns when a drop takes the column over its limit", () => {
    expect(dropExceedsWip(3, 4)).toBe(false);
    expect(dropExceedsWip(4, 4)).toBe(true);
    expect(dropExceedsWip(9, null)).toBe(false);
  });
});

it("builds distinct ids per cell and per lane card", () => {
  expect(cellId("s1", "u1")).not.toBe(cellId("s1", "u2"));
  expect(laneCardId("t1", "u1")).not.toBe(laneCardId("t1", "u2"));
});
