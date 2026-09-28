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

type StatusJson = { id: string; name: string; type: "open" | "active" | "done"; order: number };

export async function seedWorkspace(cookie: string, name = "Engineering") {
  const workspace = await api()
    .post("/api/workspaces")
    .set("Cookie", cookie)
    .send({ name, avatar: { icon: "circleDotted", color: "violet" } })
    .expect(201);
  const list = await api()
    .post("/api/lists")
    .set("Cookie", cookie)
    .send({ name: "Sprint 1", workspaceId: workspace.body.id })
    .expect(201);
  const statuses = list.body.status as StatusJson[];
  return {
    workspace: workspace.body as { id: string; avatarId: string },
    list: list.body as { id: string; workspaceId: string },
    statuses,
    openStatus: statuses.find((s) => s.type === "open")!,
    doneStatus: statuses.find((s) => s.type === "done")!,
  };
}

export async function createTask(
  cookie: string,
  input: { listId: string; statusId: string; name?: string; priority?: string },
) {
  const res = await api()
    .post("/api/tasks")
    .set("Cookie", cookie)
    .send({ name: "Task", ...input })
    .expect(201);
  return res.body as { id: string; listId: string; statusId: string; name: string };
}
