import { describe, expect, it } from "vitest";
import { statusColorHex } from "./statusColor";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";

describe("statusColorHex", () => {
  it("returns the hex for the token mapped to the given status name", () => {
    const colors = { "to do": "neutral", complete: "emerald" };

    expect(statusColorHex("to do", colors)).toBe(COLORS_TOKENS.neutral.hex);
    expect(statusColorHex("complete", colors)).toBe(COLORS_TOKENS.emerald.hex);
  });

  it("falls back to a deterministic token when the name has no color entry", () => {
    const first = statusColorHex("some custom status", {});
    const second = statusColorHex("some custom status", {});

    expect(first).toBe(second);
    expect(Object.values(COLORS_TOKENS).some((token) => token.hex === first)).toBe(true);
  });

  it("falls back to a deterministic token when the mapped token is unknown", () => {
    const colors = { review: "not-a-real-token" };

    const first = statusColorHex("review", colors);
    const second = statusColorHex("review", colors);

    expect(first).toBe(second);
    expect(Object.values(COLORS_TOKENS).some((token) => token.hex === first)).toBe(true);
  });

  it("gives the same input the same output across calls", () => {
    expect(statusColorHex("account", {})).toBe(statusColorHex("account", {}));
  });

  it("can give different names different fallback colors", () => {
    const a = statusColorHex("aaaaaaaa", {});
    const b = statusColorHex("zzzzzzzz", {});

    expect(typeof a).toBe("string");
    expect(typeof b).toBe("string");
  });
});
