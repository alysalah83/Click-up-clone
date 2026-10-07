import { randomBytes } from "node:crypto";
import type { CreateInviteInput, UpdateMemberCapacityInput, UpdateMemberRoleInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors/appError.js";
import { ForbiddenError, NotFoundError } from "../lib/errors/index.js";
import { env } from "../config/env.js";
import { assertCanAccess, hasRole, inMyWorkspaces, memberOf } from "./access.service.js";
import { assigneeUserSelect } from "./task.dto.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const memberUserSelect = { ...assigneeUserSelect, role: true } as const;

export async function listWorkspaceMembers(userId: string, workspaceId: string) {
  await assertCanAccess(userId, { workspaceId });
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      id: true,
      role: true,
      capacityTasks: true,
      capacityPoints: true,
      createdAt: true,
      user: { select: memberUserSelect },
    },
    orderBy: { createdAt: "asc" },
  });
  return members.map(({ user, ...member }) => ({
    ...member,
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    isDemo: user.role === "demo",
  }));
}

/** Everyone in any of my workspaces, with their memberships and assigned-task counts. */
export async function listPeople(userId: string) {
  const [memberships, counts] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspace: memberOf(userId) },
      select: {
        role: true,
        workspace: { select: { id: true, name: true } },
        user: { select: memberUserSelect },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.taskAssignee.groupBy({
      by: ["userId"],
      where: { task: inMyWorkspaces(userId) },
      _count: true,
    }),
  ]);

  const countByUser = new Map(counts.map((c) => [c.userId, c._count]));
  const people = new Map<
    string,
    {
      id: string;
      name: string | null;
      email: string | null;
      avatarColor: string | null;
      isDemo: boolean;
      isMe: boolean;
      assignedTasksCount: number;
      workspaces: { id: string; name: string; role: string }[];
    }
  >();
  for (const { role, workspace, user } of memberships) {
    let person = people.get(user.id);
    if (!person) {
      person = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        isDemo: user.role === "demo",
        isMe: user.id === userId,
        assignedTasksCount: countByUser.get(user.id) ?? 0,
        workspaces: [],
      };
      people.set(user.id, person);
    }
    person.workspaces.push({ ...workspace, role });
  }
  return [...people.values()];
}

async function targetMembership(workspaceId: string, targetUserId: string) {
  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });
  if (!target) throw new NotFoundError("Member not found");
  return target;
}

export async function updateMemberRole(
  userId: string,
  workspaceId: string,
  targetUserId: string,
  { role }: UpdateMemberRoleInput,
) {
  await assertCanAccess(userId, { workspaceId }, "admin");
  const target = await targetMembership(workspaceId, targetUserId);
  if (target.role === "owner") throw new ForbiddenError("The owner's role cannot be changed");
  return prisma.workspaceMember.update({ where: { id: target.id }, data: { role } });
}

/** Workload capacity of a member (any member may plan the team's capacity; guests may not). */
export async function updateMemberCapacity(
  userId: string,
  workspaceId: string,
  targetUserId: string,
  input: UpdateMemberCapacityInput,
) {
  await assertCanAccess(userId, { workspaceId }, "member");
  const target = await targetMembership(workspaceId, targetUserId);
  const { capacityTasks, capacityPoints } = await prisma.workspaceMember.update({
    where: { id: target.id },
    data: input,
    select: { capacityTasks: true, capacityPoints: true },
  });
  return { userId: targetUserId, capacityTasks, capacityPoints };
}

/** Owners/admins remove others; any non-owner may leave. Their assignments in the workspace go too. */
export async function removeMember(userId: string, workspaceId: string, targetUserId: string) {
  const { role } = await assertCanAccess(userId, { workspaceId });
  if (targetUserId !== userId && !hasRole(role, "admin"))
    throw new ForbiddenError("Only a workspace admin or above can do this");
  const target = await targetMembership(workspaceId, targetUserId);
  if (target.role === "owner") throw new ForbiddenError("The owner cannot be removed");

  await prisma.$transaction([
    prisma.taskAssignee.deleteMany({
      where: { userId: targetUserId, task: { list: { workspaceId } } },
    }),
    prisma.workspaceMember.delete({ where: { id: target.id } }),
  ]);
}

export async function createInvite(userId: string, workspaceId: string, { role }: CreateInviteInput) {
  await assertCanAccess(userId, { workspaceId }, "admin");
  const token = randomBytes(24).toString("base64url");
  const invite = await prisma.workspaceInvite.create({
    data: { workspaceId, token, role, createdById: userId, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  return {
    token,
    role: invite.role,
    expiresAt: invite.expiresAt,
    url: `${env.WEB_URL}/invite/${token}`,
  };
}

async function findValidInvite(token: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });
  if (!invite) throw new NotFoundError("Invite not found");
  if (invite.expiresAt < new Date()) throw new AppError("This invite has expired", 410);
  return invite;
}

export async function previewInvite(token: string) {
  const invite = await findValidInvite(token);
  return {
    workspace: invite.workspace,
    inviter: { name: invite.createdBy.name ?? invite.createdBy.email ?? "A teammate" },
    role: invite.role,
    expiresAt: invite.expiresAt,
  };
}

/** Joins the invite's workspace. An existing membership keeps its (possibly higher) role. */
export async function acceptInvite(userId: string, token: string) {
  const invite = await findValidInvite(token);
  const membership = await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
    create: { workspaceId: invite.workspaceId, userId, role: invite.role },
    update: {},
  });
  const firstList = await prisma.list.findFirst({
    where: { workspaceId: invite.workspaceId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return { workspaceId: invite.workspaceId, role: membership.role, listId: firstList?.id ?? null };
}
