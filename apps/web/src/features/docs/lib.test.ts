import { describe, expect, it } from "vitest";
import { buildTree, descendantIds, docTitle, parseContent } from "./lib";
import type { DocSummary } from "./types";

const doc = (id: string, parentId: string | null = null, title = id): DocSummary => ({
  id,
  parentId,
  title,
  workspaceId: "w",
  icon: null,
  updatedAt: "",
});

describe("docs lib", () => {
  it("nests pages and keeps orphans at the top level", () => {
    const tree = buildTree([doc("a"), doc("b", "a"), doc("c", "b"), doc("d", "gone")]);
    expect(tree.map((n) => n.id)).toEqual(["a", "d"]);
    expect(tree[0]!.children[0]!.children[0]!.id).toBe("c");
    expect(descendantIds(tree[0]!)).toEqual(["a", "b", "c"]);
  });

  it("falls back for empty titles and bad content", () => {
    expect(docTitle({ title: "  " })).toBe("Untitled");
    expect(parseContent("")).toBe("");
    expect(parseContent("{oops")).toBe("");
    expect(parseContent('{"type":"doc"}')).toEqual({ type: "doc" });
  });
});
