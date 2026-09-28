"use server";

import { Task } from "../types";
import { tasksService } from "../services/task.service";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";

export async function deleteTaskAction(
  taskId: Task["id"],
  listId: Task["listId"],
): Promise<ActionResponse<{ task: Task }>> {
  try {
    const task = await tasksService.deleteTask(taskId);

    updateTag(`tasks-${listId}`);

    return { status: "success", payload: { task } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
