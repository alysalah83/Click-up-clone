import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { HIGHEST_ORDER } from "../consts/status.const.js";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { AppError } from "../lib/errors/appError.js";

export const createStatus = catchAsync(
  async (
    req: Request<
      {},
      {},
      {
        name: string;
        icon: string;
        iconColor: string;
        bgColor: string;
        listId: string;
      }
    >,
    res: Response,
  ) => {
    const { userId } = req;

    const { name, icon, iconColor, bgColor, listId } = req.body;

    const latestCreatedStatus = await prisma.status.findFirst({
      orderBy: { order: "desc" },
      where: {
        listId,
        userId,
        order: { lt: HIGHEST_ORDER },
      },
      select: { order: true },
    });

    if (!latestCreatedStatus)
      throw new AppError("couldn't find latest created status", 404);

    const status = await prisma.status.create({
      data: {
        name,
        icon,
        iconColor,
        bgColor,
        userId,
        listId,
        order: latestCreatedStatus.order + 100,
      },
    });

    return res.status(201).json(status);
  },
);

export const getStatuses = catchAsync(
  async (req: Request<{ listId: string }>, res: Response) => {
    const { userId } = req;
    const { listId } = req.params;

    const statuses = await prisma.status.findMany({
      where: {
        userId,
        listId,
      },
      orderBy: { order: "asc" },
    });
    return res.status(200).json(statuses);
  },
);

export const getStatusTasksCount = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req;

    const statusCounts = await prisma.status.groupBy({
      where: { userId },
      by: "name",
      _count: { name: true },
    });

    const totalCount = statusCounts.reduce(
      (acc, item) => acc + item._count.name,
      0,
    );
    const statusCount = statusCounts.reduce<Record<string, number>>(
      (acc, item) => ({
        ...acc,
        [`${item.name}Count`]: item._count.name,
      }),
      {},
    );

    return res.status(200).json({
      totalCount,
      ...statusCount,
    });
  },
);

export const deleteStatus = catchAsync(
  async (req: Request<{ id: string }>, res: Response) => {
    const { userId } = req;
    const { id } = req.params;

    const status = await prisma.status.delete({ where: { userId, id } });

    res.status(200).json(status);
  },
);
