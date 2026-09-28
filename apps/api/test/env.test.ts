import { afterEach, describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";

const original = process.env.JWT_SECRET;

describe("loadEnv", () => {
  afterEach(() => {
    process.env.JWT_SECRET = original;
  });

  it("throws a clear error when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => loadEnv()).toThrow("Missing required environment variable: JWT_SECRET");
  });

  it("defaults JWT_EXPIRES_IN to 7d", () => {
    delete process.env.JWT_EXPIRES_IN;
    expect(loadEnv().JWT_EXPIRES_IN).toBe("7d");
  });
});
