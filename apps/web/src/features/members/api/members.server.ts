import { createServerAxios } from "@/shared/lib/axios/server";
import type { Task } from "@/features/task/types";
import type { List } from "@/features/list/types";
import type { Invite, InvitePreview, MemberRole, Person, WorkspaceMember } from "../types";

export async function getPeople() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<Person[]>("/members");
}

export async function getWorkspaceMembers(workspaceId: string) {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
}

/** Members of the workspace that holds a list (the assignee picker's options). */
export async function getListMembers(listId: string) {
  const serverAxios = await createServerAxios();
  const list = await serverAxios.get<List>(`/lists/${listId}`);
  return await getWorkspaceMembers(list.workspaceId);
}

export async function setTaskAssignees(taskId: string, userIds: string[]) {
  const serverAxios = await createServerAxios();
  return await serverAxios.put<Task>(`/tasks/${taskId}/assignees`, { userIds });
}

export async function updateMemberRole(workspaceId: string, userId: string, role: MemberRole) {
  const serverAxios = await createServerAxios();
  return await serverAxios.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
}

export async function removeMember(workspaceId: string, userId: string) {
  const serverAxios = await createServerAxios();
  return await serverAxios.delete(`/workspaces/${workspaceId}/members/${userId}`);
}

export async function createInvite(workspaceId: string, role: MemberRole) {
  const serverAxios = await createServerAxios();
  return await serverAxios.post<Invite>(`/workspaces/${workspaceId}/invites`, { role });
}

export async function previewInvite(token: string) {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<InvitePreview>(`/invites/${token}`);
}

export async function acceptInvite(token: string) {
  const serverAxios = await createServerAxios();
  return await serverAxios.post<{ workspaceId: string; role: MemberRole; listId: string | null }>(
    `/invites/${token}/accept`,
  );
}
