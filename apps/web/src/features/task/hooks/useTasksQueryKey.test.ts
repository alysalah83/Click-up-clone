import { describe, it, expect } from "vitest";
import { buildTasksQueryKey } from "./useTasksQueryKey";

describe("buildTasksQueryKey", () => {
  it("returns the base key when there are no sorted filters", () => {
    expect(buildTasksQueryKey("list-1", "")).toEqual(["tasks", "list-1"]);
  });

  it("returns the base key when sortedFilters is undefined", () => {
    expect(buildTasksQueryKey("list-1", undefined)).toEqual([
      "tasks",
      "list-1",
    ]);
  });

  it("appends the sorted filters when present", () => {
    expect(buildTasksQueryKey("list-1", "createdAt=asc&priority=desc")).toEqual([
      "tasks",
      "list-1",
      "createdAt=asc&priority=desc",
    ]);
  });
});
