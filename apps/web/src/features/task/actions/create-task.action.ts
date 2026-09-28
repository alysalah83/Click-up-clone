"use server";

import { createTaskSchema } from "../schema/task-action.schema";
import { CreateTaskInput, Task } from "../types";
import { tasksService } from "../services/task.service";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";

export async function createTaskAction(
  createTaskInput: CreateTaskInput,
): Promise<ActionResponse<{ newTask: Task }>> {
  try {
    const taskInput = createTaskSchema.parse(createTaskInput);
    const newTask = await tasksService.createTask(taskInput);

    updateTag(`tasks-${createTaskInput.listId}`);

    return { status: "success", payload: { newTask } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
