import { afterEach, describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";

const originalSecret = process.env.JWT_SECRET;
const originalExpiresIn = process.env.JWT_EXPIRES_IN;

const restore = (key: string, value: string | undefined) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
};

describe("loadEnv", () => {
  afterEach(() => {
    restore("JWT_SECRET", originalSecret);
    restore("JWT_EXPIRES_IN", originalExpiresIn);
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
