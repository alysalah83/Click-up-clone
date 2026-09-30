import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

const { resetAiRateLimits } = await import("../src/services/ai.service.js");
const { api, createTask, seedWorkspace, signUp } = await import("./helpers.js");

const reply = (text: string) => ({ content: [{ type: "text", text }] });

describe("AI endpoints", () => {
  beforeEach(() => {
    create.mockReset();
    resetAiRateLimits();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("summarizes a task and suggests subtasks through the (mocked) Claude client", async () => {
    const user = await signUp();
    const seeded = await seedWorkspace(user.cookie);
    const task = await createTask(user.cookie, {
      listId: seeded.list.id,
      statusId: seeded.openStatus.id,
      name: "Launch the beta",
    });

    create.mockResolvedValueOnce(reply("A short summary."));
    const summary = await api().post(`/api/tasks/${task.id}/ai/summarize`).set("Cookie", user.cookie).expect(200);
    expect(summary.body).toEqual({ summary: "A short summary." });
    expect(create.mock.calls[0]![0]).toMatchObject({ model: "claude-haiku-4-5-20251001" });

    create.mockResolvedValueOnce(reply('Sure:\n["Write copy", "Design page", "QA pass"]'));
    const subtasks = await api().post(`/api/tasks/${task.id}/ai/subtasks`).set("Cookie", user.cookie).expect(200);
    expect(subtasks.body).toEqual({ subtasks: ["Write copy", "Design page", "QA pass"] });
  });

  it("returns 503 without an API key and 429 past the hourly limit", async () => {
    const user = await signUp();
    const seeded = await seedWorkspace(user.cookie);
    const task = await createTask(user.cookie, { listId: seeded.list.id, statusId: seeded.openStatus.id });
    const url = `/api/tasks/${task.id}/ai/summarize`;

    delete process.env.ANTHROPIC_API_KEY;
    const res = await api().post(url).set("Cookie", user.cookie).expect(503);
    expect(res.body.error.message).toBe("AI is not configured");

    process.env.ANTHROPIC_API_KEY = "test-key";
    create.mockResolvedValue(reply("ok"));
    for (let i = 0; i < 20; i++) await api().post(url).set("Cookie", user.cookie).expect(200);
    await api().post(url).set("Cookie", user.cookie).expect(429);
  });
});
