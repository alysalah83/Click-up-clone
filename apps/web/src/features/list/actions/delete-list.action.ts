"use server";

import { Workspace } from "@/features/workspace/types";
import { List } from "../types";
import { redirect, RedirectType } from "next/navigation";
import { ActionResponse } from "@/shared/types/action.types";
import { listServices } from "../services/list.service";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function deleteList(
  workspaceId: Workspace["id"],
  listId: List["id"],
  isCurrentListDeleted: boolean,
): Promise<ActionResponse> {
  try {
    await listServices.deleteList(listId);

    updateTag("lists");
    updateTag(`lists-${workspaceId}`);
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
  if (isCurrentListDeleted)
    return redirect("/home/lists", RedirectType.replace);
  else return { status: "success" };
}
