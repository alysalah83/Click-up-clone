import { cacheLife, cacheTag } from "next/cache";
import {
  getLists,
  checkIsListBelongToWorkspace,
  createList,
  deleteList,
  getLatestCreatedListId,
  getWorkspaceLists,
  updateList,
  getListsCount,
  getList,
} from "../api/list";
import { List } from "../types";
import { Workspace } from "@/features/workspace/types";

export const listServices = {
  createList,

  async getLists() {
    "use cache: private";
    cacheTag("lists");
    cacheLife("max");
    return getLists();
  },

  async getList(listId: List["id"]) {
    "use cache: private";
    cacheTag(`list-${listId}`);
    cacheLife("max");
    return getList(listId);
  },

  async getListsCount() {
    "use cache: private";
    cacheTag("lists");
    cacheLife("max");
    return getListsCount();
  },

  async getLatestCreatedListId() {
    "use cache: private";
    cacheTag("lists");
    cacheLife("max");

    return await getLatestCreatedListId();
  },
  async getWorkspaceLists(workspaceId: Workspace["id"]) {
    "use cache: private";
    cacheTag(`lists-${workspaceId}`);
    cacheLife("max");

    return await getWorkspaceLists(workspaceId);
  },
  async checkIsListBelongToWorkspace(
    workspaceId: Workspace["id"],
    activeListId: List["id"],
  ) {
    "use cache: private";
    cacheTag(`lists-${workspaceId}`);
    cacheLife("max");

    return await checkIsListBelongToWorkspace(workspaceId, activeListId);
  },
  updateList,
  deleteList,
};
