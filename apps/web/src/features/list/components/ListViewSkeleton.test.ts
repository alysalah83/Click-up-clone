import { describe, expect, it } from "vitest";
import { viewFromPathname } from "./ListViewSkeleton";

describe("viewFromPathname", () => {
  it("maps list routes to the view they render", () => {
    expect(viewFromPathname("/home/lists")).toBe("overview");
    expect(viewFromPathname("/home/lists/l1")).toBe("board");
    expect(viewFromPathname("/home/lists/l1/board")).toBe("board");
    expect(viewFromPathname("/home/lists/l1/table")).toBe("table");
    expect(viewFromPathname("/home/lists/l1/calendar")).toBe("calendar");
    expect(viewFromPathname("/home/lists/l1/sprint")).toBe("sprint");
  });

  it("returns null outside the lists section", () => {
    expect(viewFromPathname("/home/whiteboards/b1")).toBeNull();
    expect(viewFromPathname("/home/dashboard")).toBeNull();
  });
});
