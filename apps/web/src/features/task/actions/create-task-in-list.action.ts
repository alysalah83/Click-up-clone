"use server";

import { Task } from "../types";
import { tasksService } from "../services/task.service";
import { statusServices } from "@/features/status/services/status.service";
import { findOpenStatus } from "@/features/status/lib/statusByType";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";

export async function createTaskInListAction(
  listId: string,
  name = "Untitled task",
): Promise<ActionResponse<{ newTask: Task }>> {
  try {
    const statuses = await statusServices.getStatuses(listId);
    const openStatus = findOpenStatus(statuses);
    if (!openStatus) {
      throw new Error("List has no open status to create the task in");
    }

    const newTask = await tasksService.createTask({
      listId,
      name,
      statusId: openStatus.id,
      priority: "none",
    });

    updateTag(`tasks-${listId}`);
    updateTag("tasks");

    return { status: "success", payload: { newTask } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
