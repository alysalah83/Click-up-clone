import type { JSONContent } from "@tiptap/react";
import type { DocNode, DocSummary } from "./types";

export const docTitle = (doc: Pick<DocSummary, "title">) => doc.title.trim() || "Untitled";

/** Nests a flat list by parentId. A page whose parent is missing is shown at the top level. */
export function buildTree(docs: DocSummary[]): DocNode[] {
  const nodes = new Map<string, DocNode>(docs.map((d) => [d.id, { ...d, children: [] }]));
  const roots: DocNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  return roots;
}

/** Ids of a page and everything below it. */
export function descendantIds(node: DocNode): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

export function parseContent(content: string): JSONContent | "" {
  if (!content) return "";
  try {
    return JSON.parse(content) as JSONContent;
  } catch {
    return "";
  }
}
