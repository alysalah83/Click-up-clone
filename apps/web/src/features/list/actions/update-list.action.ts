"use server";

import { ActionResponse } from "@/shared/types/action.types";
import { List, UpdateListInput } from "../types";
import { Workspace } from "@/features/workspace/types";
import { updateListSchema } from "../schema/list.schema";
import { listServices } from "../services/list.service";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function updateList(
  workspaceId: Workspace["id"],
  listId: List["id"],
  updateListInput: UpdateListInput,
): Promise<ActionResponse> {
  try {
    const listInput = updateListSchema.parse(updateListInput);
    await listServices.updateList(listId, listInput);

    updateTag("lists");
    updateTag(`lists-${workspaceId}`);

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      error: formatActionError(error),
    };
  }
}
