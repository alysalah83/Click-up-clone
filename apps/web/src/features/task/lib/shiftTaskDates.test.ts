import { describe, expect, it } from "vitest";
import { shiftTaskDates } from "./shiftTaskDates";

describe("shiftTaskDates", () => {
  it("shifts both dates by +1 when a 3-day task is dragged by its middle segment one day forward", () => {
    const task = {
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-12"),
    };
    // The task spans Jan 10-12. Its middle segment (Jan 11) is dragged to Jan 12.
    const fromCell = new Date("2026-01-11");
    const toCell = new Date("2026-01-12");

    const result = shiftTaskDates(task, fromCell, toCell);

    expect(result.startDate).toEqual(new Date("2026-01-11"));
    expect(result.endDate).toEqual(new Date("2026-01-13"));
  });

  it("keeps null dates null", () => {
    const task = { startDate: null, endDate: null };

    const result = shiftTaskDates(
      task,
      new Date("2026-01-11"),
      new Date("2026-01-12"),
    );

    expect(result.startDate).toBeNull();
    expect(result.endDate).toBeNull();
  });

  it("returns the same dates when dropping onto the same cell", () => {
    const task = {
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-12"),
    };
    const cell = new Date("2026-01-11");

    const result = shiftTaskDates(task, cell, cell);

    expect(result.startDate).toEqual(task.startDate);
    expect(result.endDate).toEqual(task.endDate);
  });
});
