"use server";

import { z } from "zod";
import { ApiError } from "@/shared/lib/errors";
import * as api from "../api/ai.server";

const id = z.uuid();

export type AiResult<T> = { ok: true; data: T } | { ok: false; message: string };

function toFriendly(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 503) return "AI is not configured on this server.";
    if (error.statusCode === 429) return "AI rate limit reached. Please try again in a minute.";
    return error.message;
  }
  return "Something went wrong";
}

export async function summarizeTaskAction(taskId: string): Promise<AiResult<string>> {
  try {
    return { ok: true, data: (await api.summarizeTask(id.parse(taskId))).summary };
  } catch (error) {
    return { ok: false, message: toFriendly(error) };
  }
}

export async function suggestSubtasksAction(taskId: string): Promise<AiResult<string[]>> {
  try {
    return { ok: true, data: (await api.suggestSubtasks(id.parse(taskId))).subtasks };
  } catch (error) {
    return { ok: false, message: toFriendly(error) };
  }
}
