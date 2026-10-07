import { describe, expect, it } from "vitest";
import { sanitizeRichText, shareTokenSchema } from "./shareLink.js";

const doc = (...content: unknown[]) => ({ type: "doc", content });

describe("sanitizeRichText", () => {
  it("keeps the nodes, attributes and marks the editors produce", () => {
    const input = doc(
      { type: "heading", attrs: { level: 2, id: "x" }, content: [{ type: "text", text: "Title" }] },
      {
        type: "taskList",
        content: [{ type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Done", marks: [{ type: "bold" }] }] }] }],
      },
    );
    expect(sanitizeRichText(input)).toEqual(
      doc(
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
        {
          type: "taskList",
          content: [{ type: "taskItem", attrs: { checked: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Done", marks: [{ type: "bold" }] }] }] }],
        },
      ),
    );
  });

  it("drops unknown nodes, unknown marks and unsafe links", () => {
    const input = doc(
      { type: "iframe", attrs: { src: "https://evil.example" } },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "a", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }, { type: "spy" }] },
          { type: "text", text: "b", marks: [{ type: "link", attrs: { href: " https://ok.example ", target: "_top" } }] },
          { type: "text", text: "" },
        ],
      },
    );
    expect(sanitizeRichText(input)).toEqual(
      doc({
        type: "paragraph",
        content: [
          { type: "text", text: "a" },
          { type: "text", text: "b", marks: [{ type: "link", attrs: { href: "https://ok.example" } }] },
        ],
      }),
    );
  });

  it("reads a serialized doc and returns null for empty or broken content", () => {
    expect(sanitizeRichText(JSON.stringify(doc({ type: "paragraph", content: [{ type: "text", text: "hi" }] })))).toEqual(
      doc({ type: "paragraph", content: [{ type: "text", text: "hi" }] }),
    );
    expect(sanitizeRichText("")).toBeNull();
    expect(sanitizeRichText("{not json")).toBeNull();
    expect(sanitizeRichText(doc())).toBeNull();
    expect(sanitizeRichText({ type: "paragraph" })).toBeNull();
    expect(sanitizeRichText(null)).toBeNull();
  });

  it("clamps heading levels", () => {
    expect(sanitizeRichText(doc({ type: "heading", attrs: { level: 9 }, content: [{ type: "text", text: "x" }] }))).toEqual(
      doc({ type: "heading", attrs: { level: 6 }, content: [{ type: "text", text: "x" }] }),
    );
  });
});

describe("shareTokenSchema", () => {
  it("accepts 22+ url-safe characters only", () => {
    expect(shareTokenSchema.safeParse("A".repeat(22)).success).toBe(true);
    expect(shareTokenSchema.safeParse("abc").success).toBe(false);
    expect(shareTokenSchema.safeParse(`${"a".repeat(21)}/`).success).toBe(false);
  });
});
