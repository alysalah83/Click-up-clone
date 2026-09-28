import { describe, it } from "vitest";
import { getSortedParamString } from "./getSortedParamString";

describe("sort params", () => {
  it("should return a sorted by ALPHABET param string", () => {
    const params = new URLSearchParams();
    params.set("status", "asc");
    params.set("priority", "desc");
    params.set("createdAt", "asc");

    expect(getSortedParamString(params)).toBe(
      "createdAt=asc&priority=desc&status=asc",
    );
  });
});
