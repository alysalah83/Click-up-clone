import z from "zod";

import {
  createTaskSchema,
  updateTaskSchema,
} from "./schema/task-action.schema";
import { Status } from "@/features/status/types";
import type { Assignee } from "@/features/members/types";
import type { CustomFieldValue } from "@/features/customFields/types";

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

type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "custom";

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
  /** Step 3 fields, sent by the API (missing on optimistic temp tasks). */
  parentTaskId?: string | null;
  tags?: TaskTag[];
  hasDescription?: boolean;
  subtaskCount?: number;
  subtaskDoneCount?: number;
  checklistTotal?: number;
  checklistDone?: number;
  attachmentCount?: number;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  /** Sprint points (null = not estimated). */
  points?: number | null;
  completedAt?: Date | string | null;
  /** Custom field values by field id (formula fields are computed, never sent). */
  customFields?: Record<string, CustomFieldValue>;
};

interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export type {
  Task,
  RecurrenceType,
  TaskTag,
  CreateTaskInput,
  TaskStatusCountsResponse,
  TasksPriorityCountResponse,
  UpdateTaskInput,
  TaskDateRange,
  SortOrder,
};
