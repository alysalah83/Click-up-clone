import { describe, expect, it } from "vitest";
import { withDateDefaults } from "./withDateDefaults";

describe("withDateDefaults", () => {
  it("replaces a null startDate with a real Date, leaving a set endDate untouched", () => {
    const endDate = new Date("2026-01-05");
    const result = withDateDefaults({ startDate: null, endDate });

    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBe(endDate);
  });

  it("replaces a null endDate with a real Date, leaving a set startDate untouched", () => {
    const startDate = new Date("2026-01-01");
    const result = withDateDefaults({ startDate, endDate: null });

    expect(result.startDate).toBe(startDate);
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it("leaves both dates untouched when neither is null", () => {
    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-01-05");
    const result = withDateDefaults({ startDate, endDate });

    expect(result).toEqual({ startDate, endDate });
  });

  it("defaults both dates when both are null, matching the old DateUpdater defaults", () => {
    const result = withDateDefaults({ startDate: null, endDate: null });

    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
  });
});
