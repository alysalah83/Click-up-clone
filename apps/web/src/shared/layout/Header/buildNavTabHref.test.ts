import { describe, expect, it } from "vitest";
import { buildNavTabHref, resolveNavListId } from "./buildNavTabHref";

describe("resolveNavListId", () => {
  it("prefers the list id from the route", () => {
    expect(resolveNavListId("abc", "latest")).toBe("abc");
  });

  it("falls back to the latest list off list pages", () => {
    expect(resolveNavListId(undefined, "latest")).toBe("latest");
  });

  it("ignores reserved route segments", () => {
    expect(resolveNavListId("board", "latest")).toBe("latest");
    expect(resolveNavListId("undefined", "latest")).toBe("latest");
  });

  it("is undefined when the user has no lists (API returns null)", () => {
    expect(resolveNavListId(undefined, null)).toBeUndefined();
    expect(resolveNavListId(undefined, undefined)).toBeUndefined();
    expect(resolveNavListId(undefined, "undefined")).toBeUndefined();
  });
});

describe("buildNavTabHref", () => {
  it("never produces an undefined list segment", () => {
    for (const href of ["/board", "/table", "/list", "/calendar"]) {
      expect(buildNavTabHref({ href, listId: undefined })).toBeNull();
    }
  });

  it("links the lists overview without a list id", () => {
    expect(buildNavTabHref({ href: "/lists", listId: undefined })).toBe(
      "/home/lists",
    );
  });

  it("builds a list-scoped href and carries non-empty sorts", () => {
    expect(buildNavTabHref({ href: "/calendar", listId: "l1" })).toBe(
      "/home/lists/l1/calendar",
    );
    expect(
      buildNavTabHref({
        href: "/board",
        listId: "l1",
        sorts: { status: "asc", priority: "", dueDate: "", createdAt: "" },
      }),
    ).toBe("/home/lists/l1/board?status=asc");
    expect(
      buildNavTabHref({
        href: "/table",
        listId: "l1",
        sorts: { status: "", priority: "", dueDate: "", createdAt: "" },
      }),
    ).toBe("/home/lists/l1/table");
  });
});
