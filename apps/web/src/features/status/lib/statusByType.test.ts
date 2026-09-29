import { describe, expect, it } from "vitest";
import { findDoneStatus, findOpenStatus, isDoneStatus } from "./statusByType";
import type { Status } from "../types";

function makeStatus(overrides: Partial<Status>): Status {
  return {
    name: "Status",
    listId: "list-1",
    icon: "circle",
    iconColor: "gray",
    bgColor: "gray",
    id: "status-id",
    order: 100,
    userId: "user-1",
    type: "active",
    isDefault: false,
    ...overrides,
  };
}

describe("findOpenStatus", () => {
  it("picks the status whose type is open", () => {
    const open = makeStatus({ id: "open", type: "open", order: 100 });
    const active = makeStatus({ id: "active", type: "active", order: 200 });
    const done = makeStatus({ id: "done", type: "done", order: 100000 });

    expect(findOpenStatus([active, done, open])).toBe(open);
  });

  it("falls back to the lowest-order status when no open status exists", () => {
    const active = makeStatus({ id: "active", type: "active", order: 200 });
    const done = makeStatus({ id: "done", type: "done", order: 100000 });
    const anotherActive = makeStatus({ id: "active-2", type: "active", order: 150 });

    expect(findOpenStatus([active, done, anotherActive])).toBe(anotherActive);
  });

  it("returns undefined when given undefined", () => {
    expect(findOpenStatus(undefined)).toBeUndefined();
  });
});

describe("findDoneStatus", () => {
  it("picks the status whose type is done", () => {
    const open = makeStatus({ id: "open", type: "open" });
    const done = makeStatus({ id: "done", type: "done" });

    expect(findDoneStatus([open, done])).toBe(done);
  });

  it("returns undefined when no done status exists", () => {
    const open = makeStatus({ id: "open", type: "open" });
    expect(findDoneStatus([open])).toBeUndefined();
  });
});

describe("isDoneStatus", () => {
  it("is true for a done status", () => {
    expect(isDoneStatus({ type: "done" })).toBe(true);
  });

  it("is false for an open or active status", () => {
    expect(isDoneStatus({ type: "open" })).toBe(false);
    expect(isDoneStatus({ type: "active" })).toBe(false);
  });
});
