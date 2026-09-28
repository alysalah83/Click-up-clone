"use server";

import { updateTag } from "next/cache";
import { createStatusSchema } from "../schema/status.schema";
import { statusServices } from "../services/status.service";
import { CreateStatusInputs, Status } from "../types";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";

export async function createStatus(
  createStatusInputs: CreateStatusInputs,
): Promise<ActionResponse<{ newStatus: Status }>> {
  try {
    const statusInputs = createStatusSchema.parse(createStatusInputs);
    const newStatus = await statusServices.createStatus(statusInputs);
    updateTag(`statuses-${createStatusInputs.listId}`);
    return { status: "success", payload: { newStatus } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
