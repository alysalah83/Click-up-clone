"use server";

import { Task, UpdateTaskInput } from "../types";
import { updateTaskSchema } from "../schema/task-action.schema";
import { tasksService } from "../services/task.service";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";

export async function updateTasksAction(
  tasksId: Set<Task["id"]>,
  updateTasksInput: UpdateTaskInput,
  listId: Task["listId"],
): Promise<ActionResponse> {
  try {
    const validUpdatedTaskFields = updateTaskSchema.parse(updateTasksInput);
    await tasksService.updateTasks([...tasksId], validUpdatedTaskFields);
    updateTag(`tasks-${listId}`);
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
