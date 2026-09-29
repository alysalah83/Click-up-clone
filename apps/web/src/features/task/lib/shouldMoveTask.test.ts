import { describe, expect, it } from "vitest";
import { shouldMoveTask } from "./shouldMoveTask";

describe("shouldMoveTask", () => {
  it("returns null when dropping on the same column", () => {
    expect(shouldMoveTask("status-1", "status-1")).toBeNull();
  });

  it("returns null when dropping on nothing", () => {
    expect(shouldMoveTask("status-1", undefined)).toBeNull();
    expect(shouldMoveTask("status-1", null)).toBeNull();
  });

  it("returns the destination status id when dropping on another column", () => {
    expect(shouldMoveTask("status-1", "status-2")).toBe("status-2");
  });

  it("compares stringified ids so a numeric overId still matches", () => {
    expect(shouldMoveTask("1", 1)).toBeNull();
    expect(shouldMoveTask("1", 2)).toBe("2");
  });
});
