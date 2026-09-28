import { cacheLife, cacheTag } from "next/cache";
import {
  createTask,
  getTasks,
  getListTasksCount,
  getTasksPrioritySummery,
  updateTask,
  updateTasks,
  deleteTask,
  deleteTasks,
  getTasksCompleteAndTotalCounts,
  getTasksCount,
} from "../api/tasks.server";
import { Task } from "../types";

export const tasksService = {
  createTask,

  async getTasks(listId: Task["listId"]) {
    "use cache: private";
    cacheTag(`tasks-${listId}`);
    cacheLife("max");

    return await getTasks(listId);
  },

  async getTasksCount() {
    "use cache: private";
    cacheTag("tasks");
    cacheLife("max");

    return await getTasksCount();
  },

  async getListTasksCount(listId: Task["listId"]) {
    "use cache: private";
    cacheTag(`tasks-${listId}`);
    cacheLife("max");

    return await getListTasksCount(listId);
  },

  async getTasksCompleteAndTotalCounts(listId: Task["listId"]) {
    "use cache: private";
    cacheTag(`tasks-${listId}`);
    cacheLife("max");

    return await getTasksCompleteAndTotalCounts(listId);
  },

  async getTasksPrioritySummery(
    ...args: Parameters<typeof getTasksPrioritySummery>
  ) {
    "use cache: private";
    cacheTag("tasks");
    cacheLife("max");

    return await getTasksPrioritySummery(...args);
  },

  updateTask,
  updateTasks,
  deleteTask,
  deleteTasks,
};
