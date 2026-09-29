"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { JSONContent } from "@tiptap/react";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import type { ActionResponse } from "@/shared/types/action.types";
import * as api from "../api/taskDetail.server";

const id = z.uuid();
const text = z.string().trim().min(1).max(256);
const doc = z.object({ type: z.literal("doc") }).loose();

/** Runs a write and refreshes the cached task lists (card badges show subtasks, checklists, tags). */
async function run<T>(
  listId: string,
  write: () => Promise<T>,
): Promise<ActionResponse<T>> {
  try {
    const validListId = id.parse(listId);
    const payload = await write();
    updateTag(`tasks-${validListId}`);
    updateTag("tasks");
    return { status: "success", payload };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}

export async function updateDescriptionAction(
  taskId: string,
  description: JSONContent | null,
  listId: string,
) {
  return run(listId, () =>
    api.updateDescription(
      id.parse(taskId),
      description === null ? null : (doc.parse(description) as JSONContent),
    ),
  );
}

export async function createSubtaskAction(
  taskId: string,
  name: string,
  listId: string,
) {
  return run(listId, () =>
    api.createSubtask(
      id.parse(taskId),
      z.string().trim().min(1).max(128).parse(name),
    ),
  );
}

export async function createChecklistAction(
  taskId: string,
  name: string,
  listId: string,
) {
  return run(listId, () =>
    api.createChecklist(id.parse(taskId), text.parse(name)),
  );
}

export async function deleteChecklistAction(
  checklistId: string,
  listId: string,
) {
  return run(listId, () => api.deleteChecklist(id.parse(checklistId)));
}

export async function createChecklistItemAction(
  checklistId: string,
  itemText: string,
  listId: string,
) {
  return run(listId, () =>
    api.createChecklistItem(id.parse(checklistId), text.parse(itemText)),
  );
}

export async function updateChecklistItemAction(
  itemId: string,
  data: { text?: string; done?: boolean },
  listId: string,
) {
  const input = z
    .object({ text: text.optional(), done: z.boolean().optional() })
    .parse(data);
  return run(listId, () => api.updateChecklistItem(id.parse(itemId), input));
}

export async function deleteChecklistItemAction(
  itemId: string,
  listId: string,
) {
  return run(listId, () => api.deleteChecklistItem(id.parse(itemId)));
}

export async function createTagAction(
  workspaceId: string,
  name: string,
  color: string,
  listId: string,
) {
  return run(listId, () =>
    api.createTag(
      id.parse(workspaceId),
      z.string().trim().min(1).max(32).parse(name),
      z.string().parse(color),
    ),
  );
}

export async function addTagToTaskAction(
  taskId: string,
  tagId: string,
  listId: string,
) {
  return run(listId, () => api.addTagToTask(id.parse(taskId), id.parse(tagId)));
}

export async function removeTagFromTaskAction(
  taskId: string,
  tagId: string,
  listId: string,
) {
  return run(listId, () =>
    api.removeTagFromTask(id.parse(taskId), id.parse(tagId)),
  );
}
