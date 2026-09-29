// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { Query } from "@tanstack/react-query";
import { toastQueryError } from "./QueryProvider";

type PlainQuery = Query<unknown, unknown, unknown, readonly unknown[]>;

describe("toastQueryError", () => {
  it("does not throw when window is undefined (SSR)", () => {
    expect(typeof window).toBe("undefined");

    const error = new Error("boom");
    const query = { meta: undefined } as unknown as PlainQuery;

    expect(() => toastQueryError(error, query)).not.toThrow();
  });

  it("does not throw when window is undefined and query.meta has an errorMessage", () => {
    const error = new Error("boom");
    const query = {
      meta: { errorMessage: "custom message" },
    } as unknown as PlainQuery;

    expect(() => toastQueryError(error, query)).not.toThrow();
  });
});
