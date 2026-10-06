"use server";

import { updateTag } from "next/cache";
import z from "zod";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";
import { List } from "@/features/list/types";
import { statusServices } from "../services/status.service";
import { Status } from "../types";

/** Mirrors `wipLimitSchema` in @clickup/shared. */
const wipLimitSchema = z.number().int().min(1).max(999).nullable();

export async function setWipLimitAction({
  statusId,
  listId,
  wipLimit,
}: {
  statusId: Status["id"];
  listId: List["id"];
  wipLimit: number | null;
}): Promise<ActionResponse<{ status: Status }>> {
  try {
    const status = await statusServices.setStatusWipLimit(statusId, wipLimitSchema.parse(wipLimit));
    updateTag(`statuses-${listId}`);
    return { status: "success", payload: { status } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
