import { describe, expect, it } from "vitest";
import { dueLabel, formatValue, fromDateInput, percent, targetSummary, toDateInput } from "./lib";

describe("goal formatting", () => {
  it("formats number and currency values", () => {
    expect(formatValue(4200, "currency", "$")).toBe("$4,200");
    expect(formatValue(-50, "currency", "€")).toBe("-€50");
    expect(formatValue(340, "number", null)).toBe("340");
    expect(formatValue(2.5, "number", "kg")).toBe("2.5 kg");
  });

  it("summarizes each target type", () => {
    const base = { currentValue: 340, targetValue: 500, unit: null, doneCount: 0, tasks: [] };
    expect(targetSummary({ ...base, type: "number" })).toBe("340 / 500");
    expect(targetSummary({ ...base, type: "boolean", currentValue: 1 })).toBe("Done");
    expect(targetSummary({ ...base, type: "boolean", currentValue: 0 })).toBe("Not done");
    expect(targetSummary({ ...base, type: "tasks", doneCount: 3, tasks: new Array(8).fill(null) })).toBe("3 / 8 tasks");
  });

  it("rounds and clamps percentages", () => {
    expect(percent(0.3625)).toBe(36);
    expect(percent(1.4)).toBe(100);
    expect(percent(-1)).toBe(0);
  });

  it("labels due dates and flags overdue ones", () => {
    const now = new Date(2026, 9, 6, 9);
    expect(dueLabel(null, now)).toBeNull();
    expect(dueLabel(new Date(2026, 9, 5, 12).toISOString(), now)).toMatchObject({ text: "Oct 5", overdue: true });
    expect(dueLabel(new Date(2026, 9, 10, 12).toISOString(), now)).toMatchObject({ overdue: false, soon: true });
    expect(dueLabel(new Date(2027, 0, 2, 12).toISOString(), now)?.text).toBe("Jan 2, 2027");
  });

  it("round-trips date inputs at 12:00 UTC", () => {
    expect(fromDateInput("2026-12-31")).toBe("2026-12-31T12:00:00.000Z");
    expect(fromDateInput("")).toBeNull();
    expect(toDateInput("2026-12-31T12:00:00.000Z")).toBe("2026-12-31");
  });
});
