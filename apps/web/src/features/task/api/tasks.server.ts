import { createServerAxios, getWithHeaders } from "@/shared/lib/axios/server";
import { CreateTaskInput, Task, TasksPriorityCountResponse } from "../types";
import { List } from "@/features/list/types";
import { fetchAllPages } from "../lib/fetchAllPages";

const TASKS_PAGE_LIMIT = 1000;

export async function createTask(createdTaskInput: CreateTaskInput) {
  const serverAxios = await createServerAxios();
  return await serverAxios.post<Task>(`/tasks`, createdTaskInput);
}

export async function getTasks(listId: List["id"] | undefined) {
  if (!listId) throw new Error("ListId is required");

  return fetchAllPages<Task>(async (cursor) => {
    const params = new URLSearchParams({
      listId,
      createdAt: "asc",
      limit: String(TASKS_PAGE_LIMIT),
    });
    if (cursor) params.set("cursor", cursor);

    const { data, nextCursor } = await getWithHeaders<Task[]>(`/tasks?${params.toString()}`);
    return { items: data, nextCursor };
  });
}

export async function getTasksCount() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<number>(`/tasks?count=${true}`);
}

export async function getListTasksCount(listId: string) {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<number>(`/tasks?listId=${listId}&count=${true}`);
}

export async function getTasksCompleteAndTotalCounts(listId: Task["listId"]) {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<{
    completedTasksCount: number;
    totalTasksCount: number;
  }>(`/tasks/${listId}/completeAndTotalTasksCounts`);
}

export async function getTasksPrioritySummery() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<TasksPriorityCountResponse>(
    `/tasks/priorityCounts`,
  );
}

export async function updateTask(taskId: string, updatedData: Partial<Task>) {
  const serverAxios = await createServerAxios();
  return await serverAxios.patch(`/tasks/${taskId}`, updatedData);
}

export async function updateTasks(
  tasksId: string[],
  updatedFields: Partial<Task>,
) {
  const serverAxios = await createServerAxios();
  return await serverAxios.patch("/tasks/bulk", {
    tasksId,
    updatedFields,
  });
}

export async function deleteTask(taskId: string) {
  const serverAxios = await createServerAxios();
  return await serverAxios.delete<Task>(`/tasks/${taskId}`);
}

export async function deleteTasks(listId: string, deletedTasksId: string[]) {
  const serverAxios = await createServerAxios();
  return await serverAxios.delete(`/tasks/${listId}/bulk`, {
    data: deletedTasksId,
  });
}
