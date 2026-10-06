import type { JSONContent } from "@tiptap/react";
import type { Assignee } from "@/features/members/types";
import type { Task } from "@/features/task/types";

/** Mirrors `TaskTemplateSnapshot` in @clickup/shared. */
export type TaskTemplateSnapshot = {
  name: string;
  description: JSONContent | null;
  priority: Task["priority"];
  points: number | null;
  tags: { name: string; color: string }[];
  /** Relative due date: days after the day the task is created. */
  dueInDays: number | null;
  subtasks: { name: string; priority: Task["priority"] }[];
  checklists: { name: string; items: string[] }[];
};

/** Mirrors the template DTO of the API (`taskTemplate.service.ts`). */
export type TaskTemplate = {
  id: string;
  workspaceId: string;
  workspace: { id: string; name: string };
  name: string;
  description: string;
  snapshot: TaskTemplateSnapshot;
  createdAt: string;
  updatedAt: string;
  createdBy: Assignee;
};

/** Where "Use template" creates the task. */
export type TemplateTarget = { listId: string; statusId: string };
