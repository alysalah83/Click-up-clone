import { describe, expect, it } from "vitest";
import type { Status } from "@/features/status/types";
import type { Task } from "@/features/task/types";
import {
  DRAFT_ID,
  ROOT_ID,
  buildMindTree,
  canAddChild,
  collapsibleIds,
  edgePath,
  fitView,
  initialView,
  layoutTree,
  READABLE_ZOOM,
  resetView,
  statusNodeId,
  zoomAt,
  type MindNode,
} from "./mindmap.lib";

const todo = { id: "s-todo", name: "to do", type: "open", order: 0 } as Status;
const doing = { id: "s-doing", name: "in progress", type: "active", order: 1 } as Status;
let clock = 0;
const task = (id: string, patch: Partial<Task> = {}): Task =>
  ({
    id,
    name: id,
    statusId: todo.id,
    status: todo,
    parentTaskId: null,
    createdAt: new Date(2026, 0, 1, 0, clock++),
    ...patch,
  }) as Task;

const tasks = [
  task("a"),
  task("b", { statusId: doing.id, status: doing }),
  task("a1", { parentTaskId: "a" }),
  task("a2", { parentTaskId: "a" }),
  task("a1x", { parentTaskId: "a1" }),
  task("a1xy", { parentTaskId: "a1x" }),
];

const ids = (n: MindNode) => n.children.map((c) => c.id);

describe("buildMindTree", () => {
  it("nests subtasks at every depth under their top-level task", () => {
    const root = buildMindTree({ tasks, statuses: [todo, doing], groupByStatus: false });
    expect(root).toMatchObject({ id: ROOT_ID, kind: "root", count: 2 });
    expect(ids(root)).toEqual(["a", "b"]);
    const a = root.children[0]!;
    expect(a).toMatchObject({ count: 2, depth: 0 });
    expect(ids(a)).toEqual(["a1", "a2"]);
    const a1x = a.children[0]!.children[0]!;
    expect(a1x).toMatchObject({ id: "a1x", depth: 2 });
    expect(a1x.children[0]).toMatchObject({ id: "a1xy", depth: 3 });
  });

  it("groups top-level tasks under status nodes in status order, empty ones included", () => {
    const empty = { id: "s-done", name: "done", type: "done", order: 2 } as Status;
    const root = buildMindTree({ tasks, statuses: [empty, doing, todo], groupByStatus: true });
    expect(ids(root)).toEqual([statusNodeId(todo.id), statusNodeId(doing.id), statusNodeId(empty.id)]);
    expect(root.children.map((s) => s.count)).toEqual([1, 1, 0]);
    expect(ids(root.children[0]!)).toEqual(["a"]);
  });

  it("follows the view's top-level order and filter but keeps subtasks and optimistic tasks", () => {
    const temp = task("temp-1");
    const root = buildMindTree({
      tasks: [...tasks, temp],
      statuses: [todo, doing],
      groupByStatus: false,
      topLevelOrder: ["b", "a"],
    });
    expect(ids(root)).toEqual(["b", "a", "temp-1"]);
    expect(ids(root.children[1]!)).toEqual(["a1", "a2"]);

    const filtered = buildMindTree({ tasks, statuses: [todo], groupByStatus: false, topLevelOrder: ["a"] });
    expect(ids(filtered)).toEqual(["a"]);
  });

  it("adds a draft child under the requested parent", () => {
    const onTask = buildMindTree({ tasks, statuses: [todo], groupByStatus: false, draftParentId: "a1" });
    const a1 = onTask.children[0]!.children[0]!;
    expect(ids(a1)).toEqual(["a1x", DRAFT_ID]);
    expect(a1.children[1]).toMatchObject({ kind: "draft", depth: 2 });

    const onStatus = buildMindTree({
      tasks,
      statuses: [todo, doing],
      groupByStatus: true,
      draftParentId: statusNodeId(doing.id),
    });
    expect(ids(onStatus.children[1]!)).toEqual(["b", DRAFT_ID]);
  });

  it("lists collapsible nodes and where children can be added", () => {
    const root = buildMindTree({ tasks, statuses: [todo, doing], groupByStatus: true });
    expect(collapsibleIds(root).sort()).toEqual(["a", "a1", "a1x", statusNodeId(doing.id), statusNodeId(todo.id)].sort());
    const a1xy = root.children[0]!.children[0]!.children[0]!.children[0]!.children[0]!;
    expect(a1xy.id).toBe("a1xy");
    expect(canAddChild(a1xy)).toBe(false);
    expect(canAddChild(root)).toBe(true);
    expect(canAddChild(root.children[0]!.children[0]!)).toBe(true);
  });
});

describe("layoutTree", () => {
  const size = (n: MindNode) => (n.kind === "root" ? { w: 200, h: 60 } : { w: 100, h: 40 });

  it("puts each level in its own column and centers parents on their children", () => {
    const root = buildMindTree({ tasks, statuses: [todo], groupByStatus: false });
    const layout = layoutTree(root, size, { hGap: 50, vGap: 10 });
    const at = (id: string) => layout.nodes.find((n) => n.node.id === id)!;

    expect(layout.nodes).toHaveLength(7);
    expect(layout.edges).toHaveLength(6);
    expect(at("a").x).toBe(250);
    expect(at("a1").x).toBe(400);
    expect(at("a1xy").x).toBe(700);
    expect(layout.width).toBe(800);

    // a1 and a2 stack; a sits on their middle; b below a's band.
    expect(at("a2").y).toBe(at("a1").y + 40 + 10);
    const center = (id: string) => at(id).y + at(id).h / 2;
    expect(center("a")).toBe((center("a1") + center("a2")) / 2);
    expect(at("b").y).toBeGreaterThanOrEqual(at("a2").y + 40 + 10);
    expect(layout.height).toBe(40 * 3 + 10 * 2);
  });

  it("hides the children of collapsed nodes", () => {
    const root = buildMindTree({ tasks, statuses: [todo], groupByStatus: false });
    const layout = layoutTree(root, size, { collapsed: new Set(["a"]) });
    expect(layout.nodes.map((n) => n.node.id)).toEqual([ROOT_ID, "a", "b"]);
    expect(layout.nodes.find((n) => n.node.id === "a")!.collapsed).toBe(true);
    expect(layout.nodes.find((n) => n.node.id === "b")!.collapsed).toBe(false);
  });

  it("draws edges from the parent's right edge to the child's left edge", () => {
    const from = { node: {} as MindNode, x: 0, y: 0, w: 100, h: 40, collapsed: false };
    const to = { node: {} as MindNode, x: 200, y: 100, w: 100, h: 40, collapsed: false };
    expect(edgePath(from, to)).toBe("M 100 20 C 150 20, 150 120, 200 120");
  });

  it("stays fast with a few hundred nodes", () => {
    const many = Array.from({ length: 300 }, (_, i) =>
      task(`t${i}`, { parentTaskId: i < 50 ? null : `t${i % 50}` }),
    );
    const root = buildMindTree({ tasks: many, statuses: [todo], groupByStatus: true });
    const start = performance.now();
    const layout = layoutTree(root, size);
    expect(layout.nodes).toHaveLength(302);
    expect(performance.now() - start).toBeLessThan(50);
  });
});

describe("zoom and pan", () => {
  it("zooms around the cursor and clamps the zoom", () => {
    const view = { x: 10, y: 20, k: 1 };
    const next = zoomAt(view, 2, 110, 120);
    // The world point under the cursor (100, 100) stays under it.
    expect((110 - next.x) / next.k).toBeCloseTo(100);
    expect((120 - next.y) / next.k).toBeCloseTo(100);
    expect(zoomAt(view, 50, 0, 0).k).toBe(2);
    expect(zoomAt(view, 0.01, 0, 0).k).toBe(0.2);
  });

  it("fits content in the viewport, never zooming past 100%", () => {
    const big = fitView({ w: 2000, h: 500 }, { w: 1080, h: 600 }, 40);
    expect(big.k).toBeCloseTo(0.5);
    expect(big.x).toBeCloseTo(40);
    expect(big.y).toBeCloseTo((600 - 250) / 2);
    expect(fitView({ w: 100, h: 100 }, { w: 1000, h: 800 }).k).toBe(1);
    expect(resetView(300, { w: 1000, h: 800 })).toEqual({ k: 1, x: 40, y: 100 });
  });

  it("starts fitted when readable, else at a readable zoom anchored on the root", () => {
    expect(initialView({ w: 600, h: 400 }, 200, { w: 1000, h: 800 })).toEqual(fitView({ w: 600, h: 400 }, { w: 1000, h: 800 }));
    const tall = initialView({ w: 1500, h: 4000 }, 2000, { w: 1000, h: 800 });
    expect(tall.k).toBe(READABLE_ZOOM);
    expect(tall.x).toBe(40);
    expect(tall.y).toBeCloseTo(400 - 2000 * READABLE_ZOOM);
    // Narrow but tall: centered horizontally.
    expect(initialView({ w: 500, h: 4000 }, 2000, { w: 1000, h: 800 }).x).toBeCloseTo((1000 - 500 * READABLE_ZOOM) / 2);
  });
});
