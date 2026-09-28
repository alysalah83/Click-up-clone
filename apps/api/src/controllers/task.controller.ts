import type { Request, Response } from "express";
import type {
  BulkUpdateTasksInput,
  CreateTaskInput,
  TasksQuery,
  UpdateTaskInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as taskService from "../services/task.service.js";

export const createTask = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await taskService.createTask(req.userId, req.body as CreateTaskInput));
});

export const getTasks = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as TasksQuery;
  if (query.count === "true")
    return res.status(200).json(await taskService.countTasks(req.userId, query.listId));

  const { tasks, nextCursor } = await taskService.listTasks(req.userId, query);
  if (nextCursor) res.set("X-Next-Cursor", nextCursor);
  res.status(200).json(tasks);
});

export const getTasksPriorityCounts = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.query as { listId?: string };
  res.status(200).json(await taskService.priorityCounts(req.userId, listId));
});

export const getTotalAndCompleteTasksCount = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await taskService.completeAndTotalCounts(req.userId, listId));
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await taskService.updateTask(req.userId, id, req.body as UpdateTaskInput));
});

export const updateManyTasks = catchAsync(async (req: Request, res: Response) => {
  await taskService.updateTasks(req.userId, req.body as BulkUpdateTasksInput);
  res.status(204).send();
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await taskService.deleteTask(req.userId, id));
});

export const deleteManyTasks = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  const deletedCount = await taskService.deleteTasksInList(req.userId, listId, req.body as string[]);
  res.status(200).json({ message: `${deletedCount} tasks deleted successfully`, deletedCount });
});
