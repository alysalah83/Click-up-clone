import type { Status } from "@/features/status/types";
import type { Task } from "@/features/task/types";

/** Mirrors MAX_SUBTASK_DEPTH in @clickup/shared: subtasks nest 3 levels under a top-level task. */
export const MAX_SUBTASK_DEPTH = 3;

export const ROOT_ID = "root";
export const DRAFT_ID = "draft";
export const statusNodeId = (statusId: string) => `status:${statusId}`;

export type MindNodeKind = "root" | "status" | "task" | "draft";

export interface MindNode {
  /** Task id, `root`, `status:<id>` or `draft`. */
  id: string;
  kind: MindNodeKind;
  task?: Task;
  /** The status of a status node. */
  status?: Status;
  /** Root: top-level task count; status: tasks in it; task: direct subtasks. */
  count: number;
  /** Task nesting level: 0 for top-level tasks (and root/status nodes). */
  depth: number;
  children: MindNode[];
}

const byCreated = (a: Task, b: Task) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || a.id.localeCompare(b.id);

/**
 * The Mind Map tree: the list, then (optionally) its statuses, then its top-level tasks, then
 * their subtasks at every depth. `topLevelOrder` (the filtered, sorted view tasks) picks which
 * top-level tasks show and in what order; their subtasks always come along. `draftParentId` adds
 * an empty "draft" child under that node (the inline "new task" input).
 */
export function buildMindTree({
  tasks,
  statuses,
  groupByStatus,
  topLevelOrder,
  draftParentId,
}: {
  tasks: Task[];
  statuses: Status[];
  groupByStatus: boolean;
  topLevelOrder?: string[];
  draftParentId?: string | null;
}): MindNode {
  const ids = new Set(tasks.map((t) => t.id));
  const childrenOf = new Map<string, Task[]>();
  const topLevel: Task[] = [];
  for (const task of tasks) {
    const parent = task.parentTaskId;
    if (parent && ids.has(parent)) childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), task]);
    else if (!parent) topLevel.push(task);
  }

  let tops: Task[];
  if (topLevelOrder) {
    const byId = new Map(topLevel.map((t) => [t.id, t]));
    tops = topLevelOrder.flatMap((id) => byId.get(id) ?? []);
    // Optimistic tasks are not in the view order yet: keep them at the end.
    tops.push(...topLevel.filter((t) => t.id.startsWith("temp-") && !topLevelOrder.includes(t.id)));
  } else tops = [...topLevel].sort(byCreated);

  const draft = (depth: number): MindNode => ({ id: DRAFT_ID, kind: "draft", count: 0, depth, children: [] });
  const withDraft = (id: string, children: MindNode[], depth: number) =>
    draftParentId === id ? [...children, draft(depth)] : children;

  const taskNode = (task: Task, depth: number, seen: Set<string>): MindNode => {
    seen.add(task.id);
    const kids = [...(childrenOf.get(task.id) ?? [])].sort(byCreated).filter((c) => !seen.has(c.id));
    return {
      id: task.id,
      kind: "task",
      task,
      count: kids.length,
      depth,
      children: withDraft(
        task.id,
        kids.map((c) => taskNode(c, depth + 1, seen)),
        depth + 1,
      ),
    };
  };

  const seen = new Set<string>();
  let children: MindNode[];
  if (groupByStatus) {
    children = [...statuses]
      .sort((a, b) => a.order - b.order)
      .map((status) => {
        const inStatus = tops.filter((t) => t.statusId === status.id);
        const id = statusNodeId(status.id);
        return {
          id,
          kind: "status" as const,
          status,
          count: inStatus.length,
          depth: 0,
          children: withDraft(
            id,
            inStatus.map((t) => taskNode(t, 0, seen)),
            0,
          ),
        };
      });
  } else children = tops.map((t) => taskNode(t, 0, seen));

  return {
    id: ROOT_ID,
    kind: "root",
    count: tops.length,
    depth: 0,
    children: withDraft(ROOT_ID, children, 0),
  };
}

/** Every node id that has children (for "Collapse all"); the root stays open. */
export function collapsibleIds(root: MindNode): string[] {
  const out: string[] = [];
  const walk = (n: MindNode) => {
    if (n.children.length && n.kind !== "root") out.push(n.id);
    n.children.forEach(walk);
  };
  walk(root);
  return out;
}

/** Whether a node can get a new child from the map ("+" button). */
export function canAddChild(node: MindNode) {
  if (node.kind === "root" || node.kind === "status") return true;
  return node.kind === "task" && !node.id.startsWith("temp-") && node.depth < MAX_SUBTASK_DEPTH;
}

// --- Layout -----------------------------------------------------------------------------------

export interface Size {
  w: number;
  h: number;
}

export interface PlacedNode {
  node: MindNode;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Has children hidden by a collapse. */
  collapsed: boolean;
}

export interface MindLayout {
  nodes: PlacedNode[];
  edges: { from: PlacedNode; to: PlacedNode }[];
  width: number;
  height: number;
}

/**
 * Tidy horizontal tree (left to right): each level is a column as wide as its widest node, each
 * node is vertically centered on the band its visible subtree needs, and siblings stack with
 * `vGap` between their bands. Collapsed nodes hide their children.
 */
export function layoutTree(
  root: MindNode,
  sizeOf: (node: MindNode) => Size,
  { collapsed = new Set<string>(), hGap = 72, vGap = 14 }: { collapsed?: Set<string>; hGap?: number; vGap?: number } = {},
): MindLayout {
  const visibleKids = (n: MindNode) => (collapsed.has(n.id) ? [] : n.children);

  // Column widths per level, and band heights per subtree.
  const colW: number[] = [];
  const band = new Map<MindNode, number>();
  const sizes = new Map<MindNode, Size>();
  const measure = (n: MindNode, level: number): number => {
    const size = sizeOf(n);
    sizes.set(n, size);
    colW[level] = Math.max(colW[level] ?? 0, size.w);
    const kids = visibleKids(n);
    const kidsH = kids.reduce((sum, k) => sum + measure(k, level + 1), 0) + vGap * Math.max(kids.length - 1, 0);
    const h = Math.max(size.h, kidsH);
    band.set(n, h);
    return h;
  };
  const height = measure(root, 0);

  const colX: number[] = [0];
  for (let i = 1; i < colW.length; i++) colX[i] = colX[i - 1]! + colW[i - 1]! + hGap;

  const nodes: PlacedNode[] = [];
  const edges: MindLayout["edges"] = [];
  const place = (n: MindNode, level: number, top: number): PlacedNode => {
    const { w, h } = sizes.get(n)!;
    const H = band.get(n)!;
    const placed: PlacedNode = {
      node: n,
      x: colX[level]!,
      y: top + (H - h) / 2,
      w,
      h,
      collapsed: collapsed.has(n.id) && n.children.length > 0,
    };
    nodes.push(placed);
    const kids = visibleKids(n);
    const kidsH = kids.reduce((sum, k) => sum + band.get(k)!, 0) + vGap * Math.max(kids.length - 1, 0);
    let y = top + (H - kidsH) / 2;
    for (const k of kids) {
      edges.push({ from: placed, to: place(k, level + 1, y) });
      y += band.get(k)! + vGap;
    }
    return placed;
  };
  place(root, 0, 0);

  const width = colX.at(-1)! + colW.at(-1)!;
  return { nodes, edges, width, height };
}

/** Smooth S-curve from the parent's right edge to the child's left edge. */
export function edgePath(from: PlacedNode, to: PlacedNode) {
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  const mx = x1 + (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

// --- Zoom and pan -----------------------------------------------------------------------------

/** Screen = world * k + (x, y). */
export interface View {
  x: number;
  y: number;
  k: number;
}

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2;
export const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

/** Zooms to `k` keeping the world point under the screen point (px, py) in place. */
export function zoomAt(view: View, k: number, px: number, py: number): View {
  const next = clampZoom(k);
  const wx = (px - view.x) / view.k;
  const wy = (py - view.y) / view.k;
  return { k: next, x: px - wx * next, y: py - wy * next };
}

/** Fits the content in the viewport (never above 100%), centered. */
export function fitView(content: Size, viewport: Size, padding = 40): View {
  const k = clampZoom(
    Math.min((viewport.w - padding * 2) / Math.max(content.w, 1), (viewport.h - padding * 2) / Math.max(content.h, 1), 1),
  );
  return { k, x: (viewport.w - content.w * k) / 2, y: (viewport.h - content.h * k) / 2 };
}

/** 100% with the root a little in from the left edge, vertically centered on it. */
export function resetView(rootCenterY: number, viewport: Size, padding = 40): View {
  return { k: 1, x: padding, y: viewport.h / 2 - rootCenterY };
}

/** Below this the first view would make cards unreadable, so it stops fitting. */
export const READABLE_ZOOM = 0.8;

/**
 * First view of the map: fit everything when that stays readable; otherwise keep a readable zoom
 * with the root a little in from the left and vertically centered, so the first levels are legible
 * (the Fit button still shows the whole map).
 */
export function initialView(content: Size, rootCenterY: number, viewport: Size, padding = 40): View {
  const fitted = fitView(content, viewport, padding);
  if (fitted.k >= READABLE_ZOOM) return fitted;
  const k = READABLE_ZOOM;
  const fitsWide = content.w * k <= viewport.w - padding * 2;
  return {
    k,
    x: fitsWide ? (viewport.w - content.w * k) / 2 : padding,
    y: viewport.h / 2 - rootCenterY * k,
  };
}
