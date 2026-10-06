import type { JSONContent } from "@tiptap/react";
import type { Task, TaskTag } from "@/features/task/types";

type ActivityType =
  | "created"
  | "status"
  | "priority"
  | "dates"
  | "renamed"
  | "assignee_added"
  | "assignee_removed"
  | "description"
  | "subtask_added"
  | "checklist_item_done"
  | "tag_added"
  | "automation"
  | "recurred"
  | "time_logged"
  | "points"
  | "sprint_carried"
  | "attachment_added"
  | "created_from_template"
  | "submitted_via_form";

interface ChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  done: boolean;
  order: number;
  assigneeId: string | null;
}

interface Checklist {
  id: string;
  taskId: string;
  name: string;
  order: number;
  items: ChecklistItem[];
}

interface ActivityEntry {
  id: string;
  type: ActivityType;
  data: Record<string, string | null | undefined>;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string | null;
    avatarColor: string | null;
  };
}

/** GET /api/tasks/:id — the task page. */
type TaskDetail = Task & {
  description: JSONContent | null;
  list: { id: string; name: string };
  workspace: { id: string; name: string };
  parentTask: { id: string; name: string } | null;
  subtasks: Task[];
  checklists: Checklist[];
  tags: TaskTag[];
  activity: ActivityEntry[];
};

export type {
  ActivityType,
  ActivityEntry,
  Checklist,
  ChecklistItem,
  TaskDetail,
  TaskTag,
};
