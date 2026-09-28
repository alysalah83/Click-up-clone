"use server";

import { ActionResponse } from "@/shared/types/action.types";
import { updateWorkSpaceSchema } from "../schema/workspace-actions.schema";
import { workspaceServices } from "../services/workspace.service";
import { updateTag } from "next/cache";
import { UpdateWorkspaceInput, Workspace } from "../types";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function updateWorkspace(
  workspaceId: Workspace["id"],
  updateWorkspaceInput: UpdateWorkspaceInput,
): Promise<ActionResponse> {
  try {
    const workspaceInput = updateWorkSpaceSchema.parse(updateWorkspaceInput);

    const workspace = await workspaceServices.updateWorkspace(
      workspaceId,
      workspaceInput,
    );

    updateTag("workspaces");

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      error: formatActionError(error),
    };
  }
}
