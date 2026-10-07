import type { PublicSharePageSummary, PublicShareStatus, PublicShareTask } from "./types";

export const sharePath = (token: string) => `/share/${encodeURIComponent(token)}`;

export const viewsLabel = (count: number) => `${count} view${count === 1 ? "" : "s"}`;

/** Statuses in board order, each with its tasks (tasks whose status is unknown are dropped). */
export function groupByStatus(statuses: PublicShareStatus[], tasks: PublicShareTask[]) {
  const ordered = [...statuses].sort((a, b) => a.order - b.order);
  const byStatus = new Map<string, PublicShareTask[]>(ordered.map((s) => [s.id, []]));
  for (const task of tasks) byStatus.get(task.statusId)?.push(task);
  return ordered.map((status) => ({ status, tasks: byStatus.get(status.id)! }));
}

export type PageNode = PublicSharePageSummary & { children: PageNode[] };

/** The shared doc's sub-pages nested under `rootId` (pages with an unknown parent are left out). */
export function pageTree(rootId: string, pages: PublicSharePageSummary[]): PageNode[] {
  const nodes = new Map<string, PageNode>(pages.map((p) => [p.id, { ...p, children: [] }]));
  const roots: PageNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId === rootId) roots.push(node);
    else if (node.parentId) nodes.get(node.parentId)?.children.push(node);
  }
  return roots;
}

export const pageTitle = (page: { title: string }) => page.title.trim() || "Untitled";

const UNITS: [limit: number, ms: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [60 * 60 * 1000, 60 * 1000, "minute"],
  [24 * 60 * 60 * 1000, 60 * 60 * 1000, "hour"],
  [30 * 24 * 60 * 60 * 1000, 24 * 60 * 60 * 1000, "day"],
];

/** "3 hours ago", "yesterday", "just now"; falls back to a short date past a month. */
export function timeAgo(iso: string, now = new Date()) {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < 60 * 1000) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [limit, ms, unit] of UNITS) if (diff < limit) return rtf.format(-Math.floor(diff / ms), unit);
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

/** GET on a public share endpoint through the web proxy; throws with the HTTP status on failure. */
export async function fetchPublicShare<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`/api/public/share/${encodeURIComponent(token)}${path}`);
  if (!res.ok) throw Object.assign(new Error(res.status === 429 ? "Too many requests. Wait a minute and try again." : "Not available"), { status: res.status });
  return (await res.json()) as T;
}
