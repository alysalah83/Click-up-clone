"use server";

import { ActionResponse } from "@/shared/types/action.types";
import { createWorkspaceSchema } from "../schema/workspace-actions.schema";
import { createWorkspaceWithDefaults } from "../services/workspaceBootstrap.service";
import { updateTag } from "next/cache";
import { CreateAvatarInput } from "../types";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function createWorkspace(
  avatar: CreateAvatarInput,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const name = formData.get("name");
    const workspaceInputs = createWorkspaceSchema.parse({ name, avatar });

    const { listId } = await createWorkspaceWithDefaults(workspaceInputs);

    updateTag("workspaces");
    return { status: "success", payload: { listId } };
  } catch (error) {
    return {
      status: "error",
      error: formatActionError(error),
    };
  }
}
