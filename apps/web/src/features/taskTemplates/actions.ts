"use server";

import { updateTag } from "next/cache";
import { createServerAxios } from "@/shared/lib/axios/server";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import type { ActionResponse } from "@/shared/types/action.types";
import type { Task } from "@/features/task/types";

/** Creates a task (with subtasks, checklists and tags) from a template, in one API call. */
export async function applyTemplateAction(
  templateId: string,
  input: { listId: string; statusId: string; name?: string },
): Promise<ActionResponse<{ newTask: Task }>> {
  try {
    const serverAxios = await createServerAxios();
    const newTask = await serverAxios.post<Task>(`/task-templates/${templateId}/apply`, input);
    updateTag(`tasks-${input.listId}`);
    updateTag("tasks");
    return { status: "success", payload: { newTask } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
