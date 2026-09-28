import { describe, expect, it } from "vitest";
import { api } from "./helpers.js";

describe("GET /health", () => {
  it("returns ok after touching the database", async () => {
    const res = await api().get("/health").expect(200);
    expect(res.body).toEqual({ ok: true });
  });
});
