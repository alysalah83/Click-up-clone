import { describe, expect, it } from "vitest";
import { groupByStatus, pageTree, sharePath, timeAgo, viewsLabel } from "./lib";
import type { PublicShareStatus, PublicShareTask } from "./types";

const status = (id: string, order: number): PublicShareStatus => ({ id, name: id, icon: "x", color: "violet", order, type: "open" });
const task = (id: string, statusId: string) => ({ id, statusId }) as PublicShareTask;

describe("share lib", () => {
  it("groups tasks under statuses in board order", () => {
    const groups = groupByStatus([status("done", 3), status("todo", 1)], [task("a", "done"), task("b", "todo"), task("c", "gone")]);
    expect(groups.map((g) => [g.status.id, g.tasks.map((t) => t.id)])).toEqual([
      ["todo", ["b"]],
      ["done", ["a"]],
    ]);
  });

  it("nests sub-pages under the shared doc", () => {
    const tree = pageTree("root", [
      { id: "a", parentId: "root", title: "A", icon: null },
      { id: "b", parentId: "a", title: "B", icon: null },
      { id: "c", parentId: "elsewhere", title: "C", icon: null },
    ]);
    expect(tree).toEqual([
      { id: "a", parentId: "root", title: "A", icon: null, children: [{ id: "b", parentId: "a", title: "B", icon: null, children: [] }] },
    ]);
  });

  it("formats paths, view counts and relative times", () => {
    expect(sharePath("abc_-1")).toBe("/share/abc_-1");
    expect(viewsLabel(1)).toBe("1 view");
    expect(viewsLabel(14)).toBe("14 views");
    const now = new Date("2026-10-08T12:00:00Z");
    expect(timeAgo("2026-10-08T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-10-08T09:00:00Z", now)).toBe("3 hours ago");
    expect(timeAgo("2026-10-07T10:00:00Z", now)).toBe("yesterday");
  });
});
