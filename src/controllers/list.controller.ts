import { Request, Response } from "express";
import { CreateListDTO } from "../types/list.dto.js";
import { prisma } from "../lib/prisma.js";
import { List } from "../generated/prisma/client.js";
import { DEFAULT_STATUS } from "../consts/status.const.js";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { AppError } from "../lib/errors/appError.js";

export const createList = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req;

  const { name, workspaceId }: CreateListDTO = req.body;

  const statusWithUserId = DEFAULT_STATUS.map((status) => ({
    ...status,
    userId,
  }));

  const list = await prisma.list.create({
    data: {
      name,
      status: {
        createMany: { data: statusWithUserId },
      },
      workspaceId,
      userId,
    },
    include: { status: true },
  });

  res.status(201).json(list);
});

export const getLists = catchAsync(
  async (req: Request<{}, {}, {}, { count?: string }>, res: Response) => {
    const { userId } = req;
    const { count } = req.query;

    if (count) {
      const lists = await prisma.list.count({ where: { userId } });

      return res.status(200).json(lists);
    }

    const lists = await prisma.list.findMany({ where: { userId } });

    return res.status(200).json(lists);
  },
);

export const getList = catchAsync(
  async (req: Request<{ listId: string }>, res: Response) => {
    const { userId } = req;
    const { listId } = req.params;

    const list = await prisma.list.findFirst({
      where: { userId, id: listId },
    });

    return res.status(200).json(list);
  },
);

export const getLatestList = catchAsync(
  async (req: Request<{}, {}, {}, { select?: string }>, res: Response) => {
    const { userId } = req;
    const { select } = req.query;

    const selectFields = select
      ? select
          .split(",")
          .reduce<
            Record<string, boolean>
          >((acc, field) => ({ ...acc, [field.trim()]: true }), {})
      : undefined;

    const latestList = await prisma.list.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      ...(selectFields && { select: selectFields }),
    });

    res.status(200).json(latestList);
  },
);

export const getListsByWorkspace = catchAsync(
  async (
    req: Request<{ workspaceId: string }, {}, {}, { select?: string }>,
    res: Response,
  ) => {
    const { userId } = req;

    const { workspaceId } = req.params;

    if (!workspaceId)
      throw new AppError("workspaceId query parameter is required", 401);

    const { select } = req.query;

    const selectFields = select
      ? select
          .split(",")
          .reduce<
            Record<string, boolean>
          >((acc, field) => ({ ...acc, [field.trim()]: true }), {})
      : undefined;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId,
      },
      ...(select && { select: selectFields }),
    });

    if (!workspace) throw new AppError("List workspace not found", 404);

    const lists = await prisma.list.findMany({ where: { workspaceId } });
    res.status(200).json(lists);
  },
);

export const checkListOwnership = catchAsync(
  async (
    req: Request<{ listId: string; workspaceId: string }>,
    res: Response,
  ) => {
    const { userId } = req;

    const { listId, workspaceId } = req.params;

    if (!listId || !workspaceId)
      throw new AppError(
        "Missing required parameters: listId and workspaceId",
        400,
      );

    const isListFromWorkspace = await prisma.list.count({
      where: { userId, workspaceId, id: listId },
    });

    return res.status(200).json(!!isListFromWorkspace);
  },
);

export const updateList = catchAsync(
  async (req: Request<{ id: string }>, res: Response) => {
    const { userId } = req;
    const { id: listId } = req.params;
    const updatedFields: Partial<Omit<List, "id" | "userId" | "workspaceId">> =
      req.body;

    const list = await prisma.list.update({
      where: { userId, id: listId },
      data: updatedFields,
    });

    return res.status(200).json(list);
  },
);

export const deleteList = catchAsync(
  async (req: Request<{ id: string }>, res: Response) => {
    const { userId } = req;
    const { id: listId } = req.params;

    await prisma.list.delete({ where: { userId, id: listId } });

    res.status(200).json({ message: "List deleted successfully" });
  },
);
