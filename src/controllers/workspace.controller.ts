import { Request, Response } from "express";
import { prisma } from "../../prisma/prisma.js";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { AppError } from "../lib/errors/appError.js";

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
