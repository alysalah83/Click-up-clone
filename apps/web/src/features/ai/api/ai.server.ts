import { createServerAxios } from "@/shared/lib/axios/server";

export async function summarizeTask(taskId: string) {
  return (await createServerAxios()).post<{ summary: string }>(`/tasks/${taskId}/ai/summarize`);
}

export async function suggestSubtasks(taskId: string) {
  return (await createServerAxios()).post<{ subtasks: string[] }>(`/tasks/${taskId}/ai/subtasks`);
}
