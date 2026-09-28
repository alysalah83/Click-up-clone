import { createServerAxios } from "@/shared/lib/axios/server";
import {
  CreateListInput,
  List,
  ListWithStatuses,
  UpdateListInput,
} from "../types";
import { Workspace } from "@/features/workspace/types";

export async function createList(createListInputs: CreateListInput) {
  const serverAxios = await createServerAxios();
  return await serverAxios.post<ListWithStatuses>("/lists", createListInputs);
}

export async function getWorkspaceLists(workspaceId: string) {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<List[]>(`/lists/workspace/${workspaceId}`);
}

export async function getLists() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<List[]>(`/lists`);
}

export async function getList(listId: List["id"]) {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<List>(`/lists/${listId}`);
}

export async function getListsCount() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<number>(`/lists?count=true`);
}

export async function getLatestCreatedListId() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<{ id: List["id"] } | undefined>(
    "/lists/latest?select=id",
  );
}

export async function checkIsListBelongToWorkspace(
  workspaceId: Workspace["id"],
  activeListId: List["id"],
) {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<boolean>(
    `/lists/${activeListId}/belong-to/${workspaceId}`,
  );
}

export async function deleteList(listId: List["id"]) {
  const serverAxios = await createServerAxios();
  await serverAxios.delete(`/lists/${listId}`);
}

export async function updateList(
  listId: List["id"],
  updateListInput: UpdateListInput,
) {
  const serverAxios = await createServerAxios();
  return await serverAxios.patch<List>(`/lists/${listId}`, updateListInput);
}
