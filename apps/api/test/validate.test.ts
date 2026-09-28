import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validate } from "../src/lib/middlewares/validate.middleware.js";
import { globalErrorHandler } from "../src/lib/middlewares/error.middleware.js";

const app = express();
app.use(express.json());
app.post(
  "/items/:id",
  validate({
    params: z.object({ id: z.uuid() }),
    query: z.object({ page: z.coerce.number().default(1) }),
    body: z.object({ name: z.string().min(1) }),
  }),
  (req, res) => {
    res.json({ params: req.params, query: req.query, body: req.body });
  },
);
app.use(globalErrorHandler);

describe("validate()", () => {
  it("replaces params, query and body with parsed data and strips unknown keys", async () => {
    const id = crypto.randomUUID();
    const res = await request(app)
      .post(`/items/${id}?page=2`)
      .send({ name: "x", userId: "evil" })
      .expect(200);
    expect(res.body).toEqual({ params: { id }, query: { page: 2 }, body: { name: "x" } });
  });

  it("responds 422 with field errors", async () => {
    const res = await request(app).post("/items/not-a-uuid").send({ name: "x" }).expect(422);
    expect(res.body.error.errors.fieldErrors.id).toBeDefined();
  });
});
