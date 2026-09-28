import { axiosClient } from "@/shared/lib/axios/client";
import { Task } from "../types";

export async function getTasksClient(listId: Task["id"], filters: string) {
  const param = new URLSearchParams(filters);
  const isContainCreatedAt = param.has("createdAt");

  return await axiosClient.get<Task[]>(
    isContainCreatedAt
      ? `/api/tasks?listId=${listId}&${filters}`
      : `/api/tasks?listId=${listId}&createdAt=asc&${filters}`,
  );
}
