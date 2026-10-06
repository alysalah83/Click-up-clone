import { cacheLife, cacheTag } from "next/cache";
import {
  createStatus,
  getStatuses,
  getStatusesCountsSummery,
  deleteStatus,
  setStatusWipLimit,
} from "../api/status.server";

export const statusServices = {
  createStatus,
  async getStatuses(listId: string) {
    "use cache: private";
    cacheTag(`statuses-${listId}`);
    cacheLife("max");
    return await getStatuses(listId);
  },
  getStatusesCountsSummery,
  deleteStatus,
  setStatusWipLimit,
};
