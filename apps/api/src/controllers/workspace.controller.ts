import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { AppError } from "../lib/errors/appError.js";
import { Task } from "../generated/prisma/index.js";
import { DEFAULT_STATUS } from "../consts/status.const.js";

export const createWorkspace = catchAsync(
  async (
    req: Request<
      {},
      {},
      { name: string; avatar: { icon: string; color: string } }
    >,
    res: Response,
  ) => {
    const { userId } = req;

    const { name, avatar } = req.body;

    const workspace = await prisma.workspace.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        name,
        avatar: { create: { icon: avatar.icon, color: avatar.color } },
      },
    });

    res.status(201).json(workspace);
  },
);

export const getWorkspaces = catchAsync(
  async (
    req: Request<{ id?: string }, {}, {}, { count?: string }>,
    res: Response,
  ) => {
    const { userId } = req;

    const { id: workspaceId } = req.params;
    const { count } = req.query;

    if (workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: { userId, id: workspaceId },
        include: { avatar: true },
      });
      return res.status(200).json(workspace);
    } else if (count === "true") {
      const workspacesCount = await prisma.workspace.count({
        where: { userId },
      });
      return res.status(200).json(workspacesCount);
    } else {
      const workspaces = await prisma.workspace.findMany({
        where: { userId },
        include: { avatar: true },
      });
      res.status(200).json(workspaces);
    }
  },
);

export const updateWorkspace = catchAsync(
  async (
    req: Request<
      { id: string },
      {},
      { name: string; avatar?: { icon?: string; color?: string } }
    >,
    res: Response,
  ) => {
    const { userId } = req;
    const { id } = req.params;
    const updatedFields = req.body;
    const { avatar, ...fieldWithoutAvatar } = updatedFields;

    const workspace = await prisma.workspace.update({
      where: { userId, id },
      data: {
        ...fieldWithoutAvatar,
        ...(avatar && {
          avatar: { update: { ...avatar } },
        }),
      },
      include: { avatar: true },
    });

    if (!workspace)
      return res.status(404).json({ message: "workspace not founded" });

    return res.status(200).json(workspace);
  },
);

export const deleteWorkspace = catchAsync(
  async (req: Request<{ id: string }>, res: Response) => {
    const { userId } = req;
    const { id: workspaceId } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: { userId, id: workspaceId },
    });
    if (!workspace) throw new AppError("Workspace not found", 404);

    await Promise.all([
      prisma.workspace.delete({ where: { userId, id: workspaceId } }),
      prisma.avatar.delete({ where: { id: workspace.avatarId } }),
    ]);

    res.status(204).send();
  },
);

export const createWorkspaceFlow = catchAsync(
  async (
    req: Request<
      {},
      {},
      {
        data: {
          workspace: { name: string; avatar: { icon: string; color: string } };
          list: { name: string };
          status: {
            name: string;
            bgColor: string;
            iconColor: string;
            icon: string;
          };
          task: {
            name: string;
            priority: Task["priority"];
            startDate: Task["startDate"];
            endDate: Task["endDate"];
          };
        };
      }
    >,
    res: Response,
  ) => {
    const { userId } = req;
    const {
      data: { workspace, list, status, task },
    } = req.body;

    const statusWithUserId = DEFAULT_STATUS.map((status) => ({
      ...status,
      userId,
    }));

    const result = await prisma.$transaction(async (tx) => {
      const createdAvatar = await tx.avatar.create({
        data: { ...workspace.avatar },
      });

      const createdWorkspace = await tx.workspace.create({
        data: { userId, name: workspace.name, avatarId: createdAvatar.id },
        include: { avatar: true },
      });

      const createdList = await tx.list.create({
        data: {
          userId,
          ...list,
          workspaceId: createdWorkspace.id,
          status: { createMany: { data: statusWithUserId } },
        },
      });

      const createdStatus = await tx.status.create({
        data: {
          ...status,
          userId,
          order: 300,
          listId: createdList.id,
        },
      });

      const createdTask = await tx.task.create({
        data: {
          userId,
          ...task,
          listId: createdList.id,
          statusId: createdStatus.id,
        },
        include: { status: true },
      });

      return {
        workspace: createdWorkspace,
        list: createdList,
        status: createdStatus,
        task: createdTask,
      };
    });
    res.status(201).json(result);
  },
);
