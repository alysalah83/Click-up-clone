import { axiosClient } from "@/shared/lib/axios/client";
import { Status } from "../types";

export async function getStatusesClient(listId: Status["listId"]) {
  return await axiosClient.get<Status[]>(`/api/statuses/${listId}`);
}
