"use server";

import z from "zod";
import { tasksService } from "../services/task.service";
import { List } from "@/features/list/types";
import { Task } from "../types";
import { updateTag } from "next/cache";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";

export async function deleteTasksAction({
  listId,
  tasksIdSet,
}: {
  listId: List["id"];
  tasksIdSet: Set<Task["id"]>;
}): Promise<ActionResponse> {
  try {
    await tasksService.deleteTasks(listId, [...tasksIdSet]);

    updateTag(`tasks-${listId}`);

    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
