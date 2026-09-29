"use client";

import { useState } from "react";
import { format } from "date-fns";
import useTasks from "@/features/task/hooks/useTasks";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import ActivityFeed from "@/features/taskDetail/components/ActivityFeed";
import ChecklistsSection from "@/features/taskDetail/components/ChecklistsSection";
import DescriptionEditor from "@/features/taskDetail/components/DescriptionEditor";
import SubtasksSection from "@/features/taskDetail/components/SubtasksSection";
import { useTaskDetail } from "@/features/taskDetail/hooks/useTaskDetail";
import type { TaskDetail } from "@/features/taskDetail/types";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import TaskProvider from "../../context/TaskProvider";
import PropertiesGrid from "./PropertiesGrid";

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[min(88vh,860px)] w-[min(1120px,calc(100vw-2rem))] flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      {children}
    </div>
  );
}

function TitleEditor({ task }: { task: TaskDetail }) {
  const { updateTask } = useUpdateTask();
  const [draft, setDraft] = useState(task.name);

  const commit = () => {
    const name = draft.trim().slice(0, 128);
    if (!name || name === task.name) return setDraft(task.name);
    updateTask({ taskId: task.id, updateTaskInput: { name } });
  };

  return (
    <textarea
      value={draft}
      rows={1}
      aria-label="task name"
      maxLength={128}
      onChange={(e) => setDraft(e.target.value.replace(/\n/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.stopPropagation();
          setDraft(task.name);
        }
      }}
      className="field-sizing-content w-full resize-none rounded-md bg-transparent px-1 py-0.5 text-2xl font-semibold text-neutral-900 outline-none hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800/60 dark:focus:bg-neutral-800/60"
    />
  );
}

function Breadcrumb({
  task,
  onOpenTask,
}: {
  task: TaskDetail;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <nav
      aria-label="breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500"
    >
      <span className="truncate">{task.workspace.name}</span>
      <ICONS_MAP.rightArrow2 className="size-3.5 shrink-0" />
      <span className="truncate">{task.list.name}</span>
      {task.parentTask && (
        <>
          <ICONS_MAP.rightArrow2 className="size-3.5 shrink-0" />
          <button
            type="button"
            onClick={() => onOpenTask(task.parentTask!.id)}
            className="cursor-pointer truncate hover:text-violet-600 hover:underline dark:hover:text-violet-300"
          >
            {task.parentTask.name}
          </button>
        </>
      )}
    </nav>
  );
}

/**
 * The ClickUp-style task page (opened from a card, deep-linked with `?task=<id>`): title,
 * properties, rich description, subtasks and checklists on the left, activity on the right.
 */
function TaskDetailPanel({
  taskId,
  onOpenTask,
}: {
  taskId: string;
  onOpenTask: (taskId: string) => void;
}) {
  const { detail, isPending, error } = useTaskDetail(taskId);
  const { tasks } = useTasks();

  if (isPending)
    return (
      <PanelShell>
        <div className="flex flex-1 flex-col gap-4 p-10" aria-busy="true">
          <SkeletonLoader height="h-3" width="w-40" />
          <SkeletonLoader height="h-8" width="w-2/3" />
          <SkeletonLoader height="h-4" count={4} />
          <SkeletonLoader height="h-32" />
        </div>
      </PanelShell>
    );

  if (error || !detail)
    return (
      <PanelShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-neutral-500">
          <ICONS_MAP.notFound className="size-10" />
          <p>
            {error?.statusCode === 404
              ? "This task doesn't exist or you don't have access."
              : "Could not load the task."}
          </p>
        </div>
      </PanelShell>
    );

  // Board edits (status, priority, dates, assignees, name) update the list cache optimistically;
  // prefer those fields so the panel reflects them instantly.
  const cached = tasks?.find((t) => t.id === taskId);
  const task: TaskDetail = cached
    ? {
        ...detail,
        name: cached.name,
        status: cached.status ?? detail.status,
        statusId: cached.statusId,
        priority: cached.priority,
        startDate: cached.startDate,
        endDate: cached.endDate,
        assignees: cached.assignees ?? detail.assignees,
      }
    : detail;

  return (
    <TaskProvider task={task}>
      <PanelShell>
        <section className="flex min-w-0 flex-1 flex-col gap-6 px-6 py-6 md:overflow-y-auto md:px-10">
          <Breadcrumb task={task} onOpenTask={onOpenTask} />
          <div className="-mt-3 flex flex-col gap-4">
            <TitleEditor key={`${task.id}-${task.name}`} task={task} />
            <PropertiesGrid task={task} />
          </div>
          <DescriptionEditor
            key={task.id}
            taskId={task.id}
            listId={task.listId}
            initialContent={detail.description}
          />
          {!task.parentTaskId && (
            <SubtasksSection detail={detail} onOpenTask={onOpenTask} />
          )}
          <ChecklistsSection detail={detail} />
          <p className="mt-auto text-xs text-neutral-400">
            Created {format(new Date(task.createdAt), "MMM d, yyyy")} · Updated{" "}
            {format(new Date(task.updatedAt), "MMM d, yyyy")}
          </p>
        </section>
        <aside className="flex w-full shrink-0 flex-col border-t border-neutral-200 bg-neutral-50 md:w-80 md:border-l md:border-t-0 dark:border-neutral-700 dark:bg-neutral-900/50">
          <header className="flex h-16 shrink-0 items-center border-b border-neutral-200 px-5 pr-16 text-sm font-semibold text-neutral-800 dark:border-neutral-700 dark:text-neutral-100">
            Activity
          </header>
          <div className="md:overflow-y-auto">
            <ActivityFeed activity={detail.activity} />
          </div>
        </aside>
      </PanelShell>
    </TaskProvider>
  );
}

export default TaskDetailPanel;
