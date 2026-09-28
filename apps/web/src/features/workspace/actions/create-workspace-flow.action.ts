"use server";

import { CreateListInput, List } from "@/features/list/types";
import { CreateStatusInputs } from "@/features/status/types";
import { CreateTaskInput } from "@/features/task/types";
import { CreateWorkspaceInputs } from "../types";
import { ActionResponse } from "@/shared/types/action.types";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { createWorkspaceSchema } from "../schema/workspace-actions.schema";
import { createListSchema } from "@/features/list/schema/list.schema";
import { createStatusSchema } from "@/features/status/schema/status.schema";
import { createTaskSchema } from "@/features/task/schema/task-action.schema";
import { workspaceServices } from "../services/workspace.service";
import { updateTag } from "next/cache";

export async function createWorkspaceFlow({
  workspaceInputs,
  listInputs,
  statusInputs,
  taskInputs,
}: {
  workspaceInputs: CreateWorkspaceInputs;
  listInputs: Omit<CreateListInput, "workspaceId">;
  statusInputs: Omit<CreateStatusInputs, "listId">;
  taskInputs: Omit<CreateTaskInput, "statusId" | "listId">;
}): Promise<ActionResponse<{ listId: List["id"] }>> {
  try {
    const workspace = createWorkspaceSchema.parse(workspaceInputs);
    const list = createListSchema.omit({ workspaceId: true }).parse(listInputs);
    const status = createStatusSchema
      .omit({ listId: true })
      .parse(statusInputs);
    const task = createTaskSchema
      .omit({ listId: true, statusId: true })
      .parse(taskInputs);

    const results = await workspaceServices.createWorkspaceFlow({
      workspace,
      list,
      status,
      task,
    });

    updateTag("workspaces");
    updateTag("lists");
    updateTag("statuses");
    updateTag("tasks");

    return { status: "success", payload: { listId: results.list.id } };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
