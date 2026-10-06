import { describe, expect, it } from "vitest";
import { createGoalTargetSchema, goalProgress, targetProgress } from "./index.js";

const num = (startValue: number, currentValue: number, targetValue: number) =>
  ({ type: "number", startValue, currentValue, targetValue }) as const;

describe("targetProgress", () => {
  it("moves number and currency targets from start to target, clamped", () => {
    expect(targetProgress(num(0, 340, 500))).toBeCloseTo(0.68);
    expect(targetProgress({ ...num(100, 300, 500), type: "currency" })).toBeCloseTo(0.5);
    expect(targetProgress(num(0, 900, 500))).toBe(1);
    expect(targetProgress(num(0, -5, 500))).toBe(0);
    // Counting down (e.g. churn 10% -> 4%).
    expect(targetProgress(num(10, 7, 4))).toBeCloseTo(0.5);
    expect(targetProgress(num(5, 5, 5))).toBe(1);
  });

  it("treats true/false targets as done at 1", () => {
    const base = { type: "boolean", startValue: 0, targetValue: 1 } as const;
    expect(targetProgress({ ...base, currentValue: 0 })).toBe(0);
    expect(targetProgress({ ...base, currentValue: 1 })).toBe(1);
  });

  it("counts done tasks, or weighs by points when every task has points", () => {
    const base = { type: "tasks", startValue: 0, currentValue: 0, targetValue: 0 } as const;
    expect(targetProgress({ ...base, tasks: [] })).toBe(0);
    expect(
      targetProgress({
        ...base,
        tasks: [
          { done: true, points: null },
          { done: false, points: 8 },
          { done: false, points: null },
          { done: true, points: 1 },
        ],
      }),
    ).toBe(0.5);
    expect(
      targetProgress({
        ...base,
        tasks: [
          { done: true, points: 3 },
          { done: false, points: 1 },
        ],
      }),
    ).toBe(0.75);
  });
});

describe("goalProgress", () => {
  it("averages its targets and is 0 without targets", () => {
    expect(goalProgress([])).toBe(0);
    expect(goalProgress([num(0, 340, 500), { type: "boolean", startValue: 0, currentValue: 1, targetValue: 1 }])).toBeCloseTo(0.84);
  });
});

describe("createGoalTargetSchema", () => {
  it("trims the name and rejects unknown types", () => {
    expect(createGoalTargetSchema.parse({ name: "  Signups ", type: "number", targetValue: 500 }).name).toBe("Signups");
    expect(createGoalTargetSchema.safeParse({ name: "x", type: "percent" }).success).toBe(false);
  });
});
