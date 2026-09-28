import { createServerAxios } from "@/shared/lib/axios/server";
import { CreateStatusInputs, Status } from "../types";
import { List } from "@/features/list/types";

export async function createStatus(createStatusInputs: CreateStatusInputs) {
  const serverAxios = await createServerAxios();
  return await serverAxios.post("/statuses", createStatusInputs);
}

export async function getStatuses(listId: List["id"]) {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<Status[]>(`/statuses/list/${listId}`);
}

export async function getStatusesCountsSummery() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<Record<`${string}Count`, number>>(
    "/statuses/statusCounts",
  );
}

export async function deleteStatus(statusId: Status["id"]) {
  const serverAxios = await createServerAxios();
  return await serverAxios.delete<Status>(`/statuses/${statusId}`);
}
