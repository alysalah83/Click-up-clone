import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { LoginInput, RegisterInput, UpdateMeInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { ConflictError, UnauthorizedError } from "../lib/errors/index.js";
import { DEMO_TEMPLATE, buildDemoAutomations, buildDemoDependencies, buildDemoWorkspace } from "../seed/demoWorkspace.js";
import { buildDemoTeammates } from "../seed/demoTeammates.js";
import { buildDemoRichTasks } from "../seed/demoRichTasks.js";
import { buildDemoCollab } from "../seed/demoCollab.js";
import { applyDemoRecurrence, buildDemoTimeEntries } from "../seed/demoTime.js";
import { buildDemoSavedViews } from "../seed/demoSavedViews.js";

const publicUser = {
  id: true,
  role: true,
  name: true,
  email: true,
  avatarColor: true,
  hasOnBoarded: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function registerUser({ name, email, password }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ConflictError("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { name, email, password: hashedPassword, role: "user" },
    select: publicUser,
  });
}

/**
 * Creates a guest together with the demo workspace, in one transaction: a failed seed leaves no
 * guest behind. Ids are generated up front, so every write is a batched createMany.
 * Fake teammates join both spaces and are assigned across the tasks. The default template also
 * gets rich descriptions, subtasks, checklists, tags and a backdated activity history.
 * Seeded guests skip the onboarding wizard.
 */
export async function registerGuest(template = DEMO_TEMPLATE) {
  const userId = randomUUID();
  const seed = buildDemoWorkspace(userId, new Date(), template);
  const team = buildDemoTeammates({
    ownerUserId: userId,
    workspaceIds: seed.workspaces.map((w) => w.id),
    taskIds: seed.tasks.map((t) => t.id),
  });
  // Sets descriptions on seed.tasks in place, so it runs before the tasks are written.
  const rich =
    template === DEMO_TEMPLATE
      ? buildDemoRichTasks({ ownerUserId: userId, seed, teammates: team.users })
      : undefined;
  applyDemoRecurrence(seed);
  const collab =
    template === DEMO_TEMPLATE
      ? buildDemoCollab({
          ownerUserId: userId,
          seed,
          teammates: team.users,
          existingAssignees: team.assignees,
        })
      : undefined;
  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: { id: userId, role: "guest", hasOnBoarded: true },
      select: publicUser,
    }),
    prisma.avatar.createMany({ data: seed.avatars }),
    prisma.workspace.createMany({ data: seed.workspaces }),
    prisma.list.createMany({ data: seed.lists }),
    prisma.status.createMany({ data: seed.statuses }),
    prisma.task.createMany({ data: seed.tasks }),
    prisma.user.createMany({ data: team.users }),
    prisma.workspaceMember.createMany({ data: team.members }),
    prisma.taskAssignee.createMany({ data: team.assignees }),
    ...(template === DEMO_TEMPLATE ? [prisma.taskDependency.createMany({ data: buildDemoDependencies(seed) })] : []),
    ...(template === DEMO_TEMPLATE
      ? [prisma.automation.createMany({ data: buildDemoAutomations(seed) })]
      : []),
    prisma.savedView.createMany({ data: buildDemoSavedViews(userId, seed.landingListId) }),
    prisma.timeEntry.createMany({
      data: buildDemoTimeEntries({ ownerUserId: userId, seed, teammates: team.users }),
    }),
    ...(rich
      ? [
          prisma.task.createMany({ data: rich.subtasks }),
          prisma.taskAssignee.createMany({ data: rich.subtaskAssignees }),
          prisma.checklist.createMany({ data: rich.checklists }),
          prisma.checklistItem.createMany({ data: rich.checklistItems }),
          prisma.tag.createMany({ data: rich.tags }),
          prisma.taskTag.createMany({ data: rich.taskTags }),
          prisma.activity.createMany({ data: rich.activities }),
        ]
      : []),
    ...(collab
      ? [
          prisma.taskAssignee.createMany({ data: collab.guestAssignees }),
          prisma.comment.createMany({ data: collab.comments }),
          prisma.commentReaction.createMany({ data: collab.reactions }),
          prisma.commentMention.createMany({ data: collab.mentions }),
          prisma.notification.createMany({ data: collab.notifications }),
        ]
      : []),
  ]);
  return { user, landingListId: seed.landingListId };
}

export async function verifyCredentials({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = user?.password ? await bcrypt.compare(password, user.password) : false;
  // One message for both cases, so the endpoint does not reveal which emails exist.
  if (!user || !isValid) throw new UnauthorizedError("Invalid email or password");

  const { password: _password, demoOwnerId: _demoOwnerId, ...rest } = user;
  return rest;
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  // A valid token for a deleted user (e.g. a cleaned-up guest) is a dead session, not a missing resource.
  if (!user) throw new UnauthorizedError("Session is no longer valid");
  return user;
}

export function updateMe(userId: string, { hasOnBoarded }: UpdateMeInput) {
  return prisma.user.update({ where: { id: userId }, data: { hasOnBoarded }, select: publicUser });
}
