import { workspaceServices } from "./workspace.service";
import { tasksService } from "@/features/task/services/task.service";
import { listServices } from "@/features/list/services/list.service";
import { CreateWorkspaceInputs } from "../types";

export async function createWorkspaceWithDefaults(
  createWorkspaceInputs: CreateWorkspaceInputs,
) {
  const workspace = await workspaceServices.createWorkspace(
    createWorkspaceInputs,
  );
  const list = await listServices.createList({
    workspaceId: workspace.id,
    name: "List 1",
  });
  await tasksService.createTask({
    listId: list.id,
    name: "Task 1",
    priority: "normal",
    statusId: list.status.find((status) => status.type === "open")?.id!,
  });
  return { listId: list.id };
}
