import z from "zod";

import {
  createTaskSchema,
  updateTaskSchema,
} from "./schema/task-action.schema";
import { Status } from "@/features/status/types";
import type { Assignee } from "@/features/members/types";

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
  status: Status;
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
  /** Always sent by the API; missing only on optimistic temp tasks. */
  assignees?: Assignee[];
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
