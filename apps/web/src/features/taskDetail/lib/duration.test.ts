import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, parseDuration } from "./duration";

describe("duration helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(5400)).toBe("1h 30m");
    expect(formatDuration(7200)).toBe("2h");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats the live clock", () => {
    expect(formatClock(5)).toBe("0:05");
    expect(formatClock(3725)).toBe("1:02:05");
  });

  it("parses typed durations", () => {
    expect(parseDuration("1h 30m")).toBe(5400);
    expect(parseDuration("45m")).toBe(2700);
    expect(parseDuration("2h")).toBe(7200);
    expect(parseDuration("90")).toBe(5400);
    expect(parseDuration("1:30")).toBe(5400);
    expect(parseDuration("1.5h")).toBe(5400);
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("0")).toBeNull();
  });
});
