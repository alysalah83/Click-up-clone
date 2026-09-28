import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Orders } from "../types/task.dto.js";
import { Priority, Task } from "../generated/prisma/client.js";
import { HIGHEST_ORDER } from "../consts/status.const.js";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { AppError } from "../lib/errors/appError.js";

export const createTask = catchAsync<
  {},
  {},
  {
    name: string;
    listId: string;
    priority: Priority;
    statusId: string;
    startDate?: Date | null;
    endDate?: Date | null;
  }
>(async (req: Request, res: Response) => {
  const { userId } = req;

  const { name, listId, priority, statusId, startDate, endDate } = req.body;

  const task = await prisma.task.create({
    data: {
      name,
      priority,
      statusId,
      startDate,
      endDate,
      userId,
      listId,
    },
    include: { status: true },
  });

  return res.status(201).json(task);
});

export const getTasks = catchAsync(
  async (
    req: Request<
      {},
      {},
      {},
      {
        listId?: string;
        status?: Orders;
        priority?: Orders;
        dueDate?: Orders;
        createdAt?: Orders;
        select?: string;
        count?: string;
      }
    >,
    res: Response,
  ) => {
    const { userId } = req;

    const { listId, select, status, priority, createdAt, dueDate, count } =
      req.query;

    const where = {
      userId,
      ...(listId && { listId }),
    };

    if (count === "true") {
      const tasks = await prisma.task.count({
        where,
      });

      return res.status(200).json(tasks);
    }

    const orderByArr = [];

    if (status) orderByArr.push({ status: { order: status } });
    if (priority) orderByArr.push({ priority });
    if (createdAt) orderByArr.push({ createdAt });
    if (dueDate) orderByArr.push({ startDate: dueDate });

    const selectedFields = select
      ? select
          .split(",")
          .reduce<
            Record<string, boolean>
          >((acc, field) => ({ ...acc, [field.trim()]: true }), {})
      : undefined;

    const queryFields = {
      where,
      orderBy: orderByArr,
      ...(select && { select: { status: true, ...selectedFields } }),
      ...(!select && { include: { status: true } }),
    };

    const tasks = await prisma.task.findMany(queryFields);

    return res.status(200).json(tasks);
  },
);

export const getTasksPriorityCounts = catchAsync(
  async (req: Request<{}, {}, {}, { listId?: string }>, res: Response) => {
    const { userId } = req;

    const { listId } = req.query;

    const priorityCounts = await prisma.task.groupBy({
      where: {
        userId,
        ...(listId ? { listId } : {}),
      },
      by: "priority",
      _count: { priority: true },
    });

    const priorityCount = priorityCounts.reduce<Record<string, number>>(
      (acc, item) => ({
        ...acc,
        [item.priority]: item._count.priority,
      }),
      {},
    );

    return res.status(200).json(priorityCount);
  },
);

export const getTotalAndCompleteTasksCount = catchAsync(
  async (req: Request<{ listId: string }>, res: Response) => {
    const { userId } = req;
    const { listId } = req.params;

    const [completedCount, totalCount] = await Promise.all([
      prisma.task.count({
        where: {
          userId,
          listId,
          status: { order: { equals: HIGHEST_ORDER } },
        },
      }),
      prisma.task.count({
        where: { userId, listId },
      }),
    ]);

    return res.status(200).json({
      totalTasksCount: totalCount,
      completedTasksCount: completedCount,
    });
  },
);

export const updateTask = catchAsync(
  async (
    req: Request<
      { id: string },
      {},
      {
        statusId?: string;
        priority?: Priority;
        name?: string;
        startDate?: Date;
        endDate?: Date;
      }
    >,
    res: Response,
  ) => {
    const { userId } = req;

    const { id: taskId } = req.params;
    const { name, startDate, endDate, priority, statusId } = req.body;

    const task = await prisma.task.update({
      where: { userId, id: taskId },
      data: {
        name,
        startDate,
        endDate,
        priority,
        statusId,
      },
      include: { status: true },
    });

    res.status(200).json(task);
  },
);

export const deleteTask = catchAsync(
  async (req: Request<{ id: string }>, res: Response) => {
    const { userId } = req;

    const { id: taskId } = req.params;

    const task = await prisma.task.delete({
      where: { id: taskId, userId },
    });

    res.status(200).json(task);
  },
);

export const deleteManyTasks = catchAsync(
  async (
    req: Request<{ id: string }, {}, { tasksId: Task["id"] }>,
    res: Response,
  ) => {
    const { userId } = req;

    const { id: listId } = req.params;
    const tasksId = req.body;

    if (!Array.isArray(tasksId) || tasksId.length === 0)
      throw new AppError("tasksId must be a non-empty array", 409);

    const result = await prisma.task.deleteMany({
      where: { userId, listId, id: { in: tasksId } },
    });

    res.status(200).json({
      message: `${result.count} tasks deleted successfully`,
      deletedCount: result.count,
    });
  },
);

export const updateManyTasks = catchAsync<
  {},
  {},
  {
    tasksId?: Task["id"][];
    updatedFields: {
      name?: string;
      statusId?: string;
      priority?: Priority;
      startDate?: Date;
      endDate?: Date;
    };
  }
>(async (req: Request, res: Response) => {
  const { userId } = req;

  const {
    tasksId,
    updatedFields: { name, startDate, endDate, priority, statusId },
  } = req.body;

  if (!Array.isArray(tasksId) || tasksId.length === 0)
    throw new AppError("tasksId must be a non-empty array", 409);

  await prisma.task.updateMany({
    where: { userId, id: { in: tasksId } },
    data: {
      name,
      startDate,
      endDate,
      priority,
      statusId,
    },
  });

  res.status(204).send();
});
