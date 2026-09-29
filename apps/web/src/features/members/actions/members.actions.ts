"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import type { ActionResponse } from "@/shared/types/action.types";
import * as membersApi from "../api/members.server";
import type { Invite } from "../types";

const idSchema = z.uuid();
const assignableRoleSchema = z.enum(["admin", "member", "guest"]);

export async function setTaskAssigneesAction(
  taskId: string,
  userIds: string[],
  listId: string,
): Promise<ActionResponse> {
  try {
    await membersApi.setTaskAssignees(idSchema.parse(taskId), z.array(idSchema).parse(userIds));
    updateTag(`tasks-${listId}`);
    updateTag("tasks");
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}

export async function updateMemberRoleAction(
  workspaceId: string,
  userId: string,
  role: string,
): Promise<ActionResponse> {
  try {
    await membersApi.updateMemberRole(
      idSchema.parse(workspaceId),
      idSchema.parse(userId),
      assignableRoleSchema.parse(role),
    );
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}

export async function removeMemberAction(workspaceId: string, userId: string): Promise<ActionResponse> {
  try {
    await membersApi.removeMember(idSchema.parse(workspaceId), idSchema.parse(userId));
    updateTag("tasks");
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}

export async function createInviteAction(
  workspaceId: string,
  role: string = "member",
): Promise<ActionResponse<Invite>> {
  try {
    const invite = await membersApi.createInvite(idSchema.parse(workspaceId), assignableRoleSchema.parse(role));
    return { status: "success", payload: invite };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
