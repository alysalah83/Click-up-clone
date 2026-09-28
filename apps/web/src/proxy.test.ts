// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { proxy } from "./proxy";

const SECRET = "proxy-test-secret";

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

const makeRequest = (path: string, token?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: token ? { cookie: `token=${token}` } : {},
  });

const expiredToken = () =>
  jwt.sign(
    { id: "u1", role: "user", exp: Math.floor(Date.now() / 1000) - 60 },
    SECRET,
  );

const expectTokenCleared = (res: Response) => {
  const setCookie = res.headers.get("set-cookie") ?? "";
  expect(setCookie).toMatch(/token=;/);
  expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
};

describe("proxy", () => {
  it("expired token on /login -> next and cookie cleared (no redirect loop)", async () => {
    const res = await proxy(makeRequest("/login", expiredToken()));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expectTokenCleared(res);
  });

  it("invalid token on /signup -> next and cookie cleared", async () => {
    const res = await proxy(makeRequest("/signup", "not-a-jwt"));
    expect(res.status).toBe(200);
    expectTokenCleared(res);
  });

  it("expired token on /home/lists -> redirect to /login and cookie cleared", async () => {
    const res = await proxy(makeRequest("/home/lists", expiredToken()));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    expectTokenCleared(res);
  });

  it("valid user token on /login -> redirect to /home/lists", async () => {
    const token = jwt.sign({ id: "u1", role: "user" }, SECRET, {
      expiresIn: "1h",
    });
    const res = await proxy(makeRequest("/login", token));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/home/lists");
  });

  it("valid guest token on /login -> next", async () => {
    const token = jwt.sign({ id: "g1", role: "guest" }, SECRET, {
      expiresIn: "1h",
    });
    const res = await proxy(makeRequest("/login", token));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("no token on /home -> redirect to /login", async () => {
    const res = await proxy(makeRequest("/home"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });
});
