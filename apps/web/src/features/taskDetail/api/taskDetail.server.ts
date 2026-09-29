import type { JSONContent } from "@tiptap/react";
import { createServerAxios } from "@/shared/lib/axios/server";
import type { Task } from "@/features/task/types";
import type { Checklist, ChecklistItem, TaskDetail, TaskTag } from "../types";

const api = createServerAxios;

export async function getTaskDetail(taskId: string) {
  return (await api()).get<TaskDetail>(`/tasks/${taskId}`);
}

export async function getWorkspaceTags(workspaceId: string) {
  return (await api()).get<TaskTag[]>(`/workspaces/${workspaceId}/tags`);
}

export async function updateDescription(
  taskId: string,
  description: JSONContent | null,
) {
  return (await api()).patch(`/tasks/${taskId}/description`, { description });
}

export async function createSubtask(taskId: string, name: string) {
  return (await api()).post<Task>(`/tasks/${taskId}/subtasks`, { name });
}

export async function createChecklist(taskId: string, name: string) {
  return (await api()).post<Checklist>(`/tasks/${taskId}/checklists`, { name });
}

export async function deleteChecklist(checklistId: string) {
  return (await api()).delete(`/checklists/${checklistId}`);
}

export async function createChecklistItem(checklistId: string, text: string) {
  return (await api()).post<ChecklistItem>(`/checklists/${checklistId}/items`, {
    text,
  });
}

export async function updateChecklistItem(
  itemId: string,
  data: { text?: string; done?: boolean },
) {
  return (await api()).patch<ChecklistItem>(`/checklist-items/${itemId}`, data);
}

export async function deleteChecklistItem(itemId: string) {
  return (await api()).delete(`/checklist-items/${itemId}`);
}

export async function createTag(
  workspaceId: string,
  name: string,
  color: string,
) {
  return (await api()).post<TaskTag>(`/workspaces/${workspaceId}/tags`, {
    name,
    color,
  });
}

export async function addTagToTask(taskId: string, tagId: string) {
  return (await api()).put(`/tasks/${taskId}/tags/${tagId}`);
}

export async function removeTagFromTask(taskId: string, tagId: string) {
  return (await api()).delete(`/tasks/${taskId}/tags/${tagId}`);
}
