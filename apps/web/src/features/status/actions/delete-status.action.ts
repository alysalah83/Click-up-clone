"use server";

import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";
import { statusServices } from "../services/status.service";
import { Status } from "../types";
import { updateTag } from "next/cache";
import { List } from "@/features/list/types";

export async function deleteStatus({
  statusId,
  listId,
}: {
  statusId: Status["id"];
  listId: List["id"];
}): Promise<ActionResponse<{ deletedStatus: Status }>> {
  try {
    const status = await statusServices.deleteStatus(statusId);

    updateTag(`statuses-${listId}`);

    return { status: "success", payload: { deletedStatus: status } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
