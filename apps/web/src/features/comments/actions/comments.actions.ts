"use server";

import { z } from "zod";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import type { ActionResponse } from "@/shared/types/action.types";
import * as api from "../api/comments.server";

const id = z.uuid();

export async function createCommentAction(
  taskId: string,
  body: string,
  parentId?: string,
): Promise<ActionResponse> {
  try {
    await api.createComment(
      id.parse(taskId),
      z.string().trim().min(1).max(5000).parse(body),
      parentId ? id.parse(parentId) : undefined,
    );
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}

export async function deleteCommentAction(commentId: string): Promise<ActionResponse> {
  try {
    await api.deleteComment(id.parse(commentId));
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}

export async function toggleReactionAction(commentId: string, emoji: string): Promise<ActionResponse> {
  try {
    await api.toggleReaction(id.parse(commentId), z.string().trim().min(1).max(16).parse(emoji));
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
