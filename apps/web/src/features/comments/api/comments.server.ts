import { createServerAxios } from "@/shared/lib/axios/server";
import type { CommentDto } from "../types";

export async function getComments(taskId: string) {
  return (await createServerAxios()).get<CommentDto[]>(`/tasks/${taskId}/comments`);
}

export async function createComment(taskId: string, body: string, parentId?: string) {
  return (await createServerAxios()).post<CommentDto>(`/tasks/${taskId}/comments`, { body, parentId });
}

export async function deleteComment(commentId: string) {
  return (await createServerAxios()).delete(`/comments/${commentId}`);
}

export async function toggleReaction(commentId: string, emoji: string) {
  return (await createServerAxios()).post(`/comments/${commentId}/reactions`, { emoji });
}
