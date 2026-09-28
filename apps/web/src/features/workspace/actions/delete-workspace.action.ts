"use server";

import { List } from "@/features/list/types";
import { Workspace } from "../types";
import { ActionResponse } from "@/shared/types/action.types";
import { workspaceServices } from "../services/workspace.service";
import { updateTag } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { listServices } from "@/features/list/services/list.service";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function deleteWorkspace({
  workspaceId,
  activeListId,
}: {
  workspaceId: Workspace["id"];
  activeListId: List["id"] | null | undefined;
}): Promise<ActionResponse> {
  let listIdIsActive;
  try {
    if (activeListId)
      listIdIsActive = await listServices.checkIsListBelongToWorkspace(
        workspaceId,
        activeListId,
      );

    await workspaceServices.deleteWorkspace(workspaceId);
    updateTag("workspaces");
  } catch (error) {
    return {
      status: "error",
      error: formatActionError(error),
    };
  }
  if (listIdIsActive) redirect("/home/lists", RedirectType.replace);
  return { status: "success" };
}
