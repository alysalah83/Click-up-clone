"use server";

import { updateTag } from "next/cache";

/** Refreshes the cached sidebar and lists overview after an import created a list. */
export async function refreshAfterImport(workspaceId: string, listId: string) {
  updateTag("lists");
  updateTag(`lists-${workspaceId}`);
  updateTag(`list-${listId}`);
  updateTag(`tasks-${listId}`);
  updateTag("tasks");
}
