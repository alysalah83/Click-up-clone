"use server";

import { updateTag } from "next/cache";
import { createServerAxios } from "@/shared/lib/axios/server";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import type { ActionResponse } from "@/shared/types/action.types";

/** Refreshes the cached sidebar, the list headers and the task views after a sprint change. */
function refresh(workspaceId: string, listIds: string[]) {
  updateTag("lists");
  updateTag(`lists-${workspaceId}`);
  updateTag("tasks");
  for (const id of listIds) {
    updateTag(`list-${id}`);
    updateTag(`tasks-${id}`);
  }
}

/** Creates the next sprint of a space (number, dates and statuses follow the latest sprint). */
export async function createSprintAction(workspaceId: string): Promise<ActionResponse<{ listId: string }>> {
  try {
    const serverAxios = await createServerAxios();
    const list = await serverAxios.post<{ id: string }>("/sprints", { workspaceId });
    refresh(workspaceId, [list.id]);
    return { status: "success", payload: { listId: list.id } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}

/** Completes the active sprint; unfinished tasks move into the next one, which becomes active. */
export async function completeSprintAction(
  workspaceId: string,
  listId: string,
): Promise<ActionResponse<{ nextListId: string; nextName: string; carriedCount: number }>> {
  try {
    const serverAxios = await createServerAxios();
    const result = await serverAxios.post<{ nextSprint: { id: string; name: string }; carriedCount: number }>(
      `/sprints/${listId}/complete`,
    );
    refresh(workspaceId, [listId, result.nextSprint.id]);
    return {
      status: "success",
      payload: { nextListId: result.nextSprint.id, nextName: result.nextSprint.name, carriedCount: result.carriedCount },
    };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
