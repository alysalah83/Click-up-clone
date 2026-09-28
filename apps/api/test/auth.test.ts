import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { api, signUp } from "./helpers.js";

describe("auth", () => {
  it("register returns the user without a password hash, plus a 7-day token", async () => {
    const { user, token } = await signUp();
    expect(user).not.toHaveProperty("password");
    const decoded = jwt.decode(token) as { exp: number; iat: number; role: string };
    expect(decoded.role).toBe("user");
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  it("register validates input", async () => {
    const res = await api()
      .post("/api/users/register/user")
      .send({ name: "A", email: "not-an-email", password: "123" })
      .expect(422);
    expect(Object.keys(res.body.error.errors.fieldErrors).sort()).toEqual(["email", "name", "password"]);
  });

  it("register rejects a duplicate email", async () => {
    const { credentials } = await signUp();
    await api().post("/api/users/register/user").send(credentials).expect(409);
  });

  it("login gives the same 401 for unknown email and wrong password", async () => {
    const { credentials } = await signUp();
    const wrongPassword = await api()
      .post("/api/users/login")
      .send({ email: credentials.email, password: "nope-nope" })
      .expect(401);
    const unknownEmail = await api()
      .post("/api/users/login")
      .send({ email: "ghost@test.dev", password: "nope-nope" })
      .expect(401);
    expect(wrongPassword.body.error.message).toBe("Invalid email or password");
    expect(unknownEmail.body.error.message).toBe("Invalid email or password");
  });

  it("login succeeds with the right password", async () => {
    const { credentials } = await signUp();
    const res = await api()
      .post("/api/users/login")
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("login is rate limited per email after 10 attempts", async () => {
    const email = `limited-${Date.now()}@test.dev`;
    for (let i = 0; i < 10; i++)
      await api().post("/api/users/login").send({ email, password: "wrong" }).expect(401);
    const res = await api().post("/api/users/login").send({ email, password: "wrong" }).expect(429);
    expect(res.body.error.message).toBe("Too many attempts, please try again later");
  });

  it("guest registration sets exactly one cookie", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    expect(res.body.user.role).toBe("guest");
    expect(res.headers["set-cookie"]).toHaveLength(1);
  });

  it("GET /api/users/:id no longer exposes other users", async () => {
    const a = await signUp();
    const b = await signUp();
    await api().get(`/api/users/${b.user.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("GET /api/users requires a token", async () => {
    await api().get("/api/users").expect(401);
  });

  it("PATCH /api/users only accepts a boolean hasOnBoarded", async () => {
    const { cookie } = await signUp();
    await api().patch("/api/users").set("Cookie", cookie).send({ hasOnBoarded: "yes" }).expect(422);
    const res = await api()
      .patch("/api/users")
      .set("Cookie", cookie)
      .send({ hasOnBoarded: true, role: "guest" })
      .expect(200);
    expect(res.body).toMatchObject({ hasOnBoarded: true, role: "user" });
  });

  it("sends security headers", async () => {
    const res = await api().get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("answers malformed JSON with 400, not 500", async () => {
    await api()
      .post("/api/users/login")
      .set("Content-Type", "application/json")
      .send("{bad json")
      .expect(400);
  });
});
