import z from "zod";

import {
  createTaskSchema,
  updateTaskSchema,
} from "./schema/task-action.schema";

interface TaskDateRange {
  startDate: Task["startDate"];
  endDate: Task["endDate"];
}

interface TaskStatusCountsResponse {
  completeCount: number;
  inProgressCount: number;
  toDoCount: number;
  totalCount: number;
}

interface TasksPriorityCountResponse {
  urgent: number;
  high: number;
  normal: number;
  low: number;
  none: number;
}

type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

type SortOrder = "" | "asc" | "desc";

type Task = {
  status: {
    name: string;
    id: string;
    userId: string;
    listId: string;
    icon: string;
    iconColor: string;
    bgColor: string;
    order: number;
  };
} & {
  name: string;
  id: string;
  userId: string;
  statusId: string;
  priority: "urgent" | "high" | "normal" | "low" | "none";
  startDate: Date | null;
  endDate: Date | null;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type {
  Task,
  CreateTaskInput,
  TaskStatusCountsResponse,
  TasksPriorityCountResponse,
  UpdateTaskInput,
  TaskDateRange,
  SortOrder,
};
