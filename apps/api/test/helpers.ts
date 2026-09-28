import request from "supertest";
import app from "../src/app.js";

export const api = () => request(app);

let counter = 0;

export async function signUp(
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  counter += 1;
  const credentials = {
    name: "Test User",
    email: `user${counter}-${Date.now()}@test.dev`,
    password: "secret123",
    ...overrides,
  };
  const res = await api().post("/api/users/register/user").send(credentials).expect(201);
  const token = res.body.token as string;
  return {
    user: res.body.user as { id: string },
    token,
    cookie: `token=${token}`,
    credentials,
  };
}
