import { createServerAxios } from "@/shared/lib/axios/server";
import {
  CreateWorkspaceInputs,
  UpdateWorkspaceInput,
  Workspace,
} from "../types";
import { CreateListInput, List } from "@/features/list/types";
import { CreateStatusInputs, Status } from "@/features/status/types";
import { CreateTaskInput, Task } from "@/features/task/types";

export async function createWorkspace(
  createWorkspaceInputs: CreateWorkspaceInputs,
) {
  const serverAxios = await createServerAxios();
  return await serverAxios.post("/workspaces", createWorkspaceInputs);
}

export async function createWorkspaceFlow({
  workspace,
  list,
  status,
  task,
}: {
  workspace: CreateWorkspaceInputs;
  list: Omit<CreateListInput, "workspaceId">;
  status: Omit<CreateStatusInputs, "listId">;
  task: Omit<CreateTaskInput, "statusId" | "listId">;
}) {
  const serverAxios = await createServerAxios();
  return await serverAxios.post<{
    workspace: Workspace;
    list: List;
    status: Status;
    task: Task;
  }>("/workspaces/flow", {
    data: {
      workspace,
      list,
      status,
      task,
    },
  });
}

export const getWorkspaces = async () => {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<Workspace[]>("/workspaces");
};

export async function getWorkspacesCount() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<number>(`/workspaces?count=${true}`);
}

export async function updateWorkspace(
  workspaceId: Workspace["id"],
  updateWorkspaceInput: UpdateWorkspaceInput,
) {
  const serverAxios = await createServerAxios();
  return await serverAxios.patch<Workspace>(
    `/workspaces/${workspaceId}`,
    updateWorkspaceInput,
  );
}

export async function deleteWorkspace(workspaceId: Workspace["id"]) {
  const serverAxios = await createServerAxios();
  return await serverAxios.delete(`/workspaces/${workspaceId}`);
}
