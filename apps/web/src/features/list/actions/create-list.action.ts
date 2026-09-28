"use server";

import { Workspace } from "@/features/workspace/types";
import { ActionResponse } from "@/shared/types/action.types";
import { createListSchema } from "../schema/list.schema";
import { listServices } from "../services/list.service";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function createList(
  workspaceId: Workspace["id"],
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const name = formData.get("name");
    const createListInputs = createListSchema.parse({ name, workspaceId });

    const list = await listServices.createList(createListInputs);

    updateTag("lists");
    updateTag(`lists-${workspaceId}`);
    return { status: "success", payload: { listId: list.id } };
  } catch (error) {
    return {
      status: "error",
      error: formatActionError(error),
    };
  }
}
