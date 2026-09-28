"use server";

import { Task, UpdateTaskInput } from "../types";
import { updateTaskSchema } from "../schema/task-action.schema";
import { tasksService } from "../services/task.service";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";

export async function updateTaskAction(
  taskId: Task["id"],
  updateTaskInput: UpdateTaskInput,
  listId: Task["listId"],
): Promise<ActionResponse> {
  try {
    const taskInput = updateTaskSchema.parse(updateTaskInput);
    await tasksService.updateTask(taskId, taskInput);
    updateTag(`tasks-${listId}`);
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
