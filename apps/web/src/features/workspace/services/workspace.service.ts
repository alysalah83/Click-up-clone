import { cacheLife, cacheTag } from "next/cache";
import {
  createWorkspace,
  createWorkspaceFlow,
  deleteWorkspace,
  getWorkspaces,
  getWorkspacesCount,
  getWorkspacesWithLists,
  updateWorkspace,
} from "../api/workspace";

export const workspaceServices = {
  createWorkspace,
  createWorkspaceFlow,
  async getWorkspaces() {
    "use cache: private";
    cacheTag("workspaces");
    cacheLife("max");
    return await getWorkspaces();
  },
  /** One call returning each workspace with its lists, so the sidebar avoids a per-workspace fetch. */
  async getWorkspacesWithLists() {
    "use cache: private";
    cacheTag("workspaces");
    cacheTag("lists");
    cacheLife("max");
    return await getWorkspacesWithLists();
  },
  async getWorkspacesCount() {
    "use cache: private";
    cacheTag("workspaces");
    cacheLife("max");
    return await getWorkspacesCount();
  },
  updateWorkspace,
  deleteWorkspace,
};
