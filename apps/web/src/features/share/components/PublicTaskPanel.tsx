"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import StatusBadge from "@/features/status/components/StatusBadge";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import TagChip from "@/features/taskDetail/components/TagChip";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPublicShare } from "../lib";
import type { PublicShareStatus, PublicShareTaskDetail } from "../types";
import RichTextView from "./RichTextView";
import { DueDate, PriorityFlag, asAvatars } from "./TaskBits";

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; task: PublicShareTaskDetail };

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

const empty = <span className="text-muted-foreground">Empty</span>;

/** Read-only side panel for one task of a shared list (description, properties, subtasks). */
function PublicTaskPanel({
  token,
  taskId,
  statusById,
  onOpenTask,
  onClose,
}: {
  token: string;
  taskId: string;
  statusById: Map<string, PublicShareStatus>;
  onOpenTask: (id: string) => void;
  onClose: () => void;
}) {
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchPublicShare<PublicShareTaskDetail>(token, `/tasks/${encodeURIComponent(taskId)}`)
      .then((task) => !cancelled && setLoad({ state: "ready", task }))
      .catch((error: Error) => !cancelled && setLoad({ state: "error", message: error.message }));
    return () => {
      cancelled = true;
    };
  }, [token, taskId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const task = load.state === "ready" ? load.task : null;
  const status = task ? statusById.get(task.statusId) : undefined;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={task?.name ?? "Task"}>
      <button type="button" aria-label="Close task" onClick={onClose} className="absolute inset-0 cursor-default bg-black/30" />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white/95 px-4 py-2.5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            Task · read-only
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="size-4" />
          </button>
        </header>

        {load.state === "loading" && (
          <div className="flex flex-col gap-3 p-5" aria-busy="true">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
        {load.state === "error" && <p className="p-5 text-sm text-muted-foreground">This task is not available. {load.message}</p>}

        {task && (
          <div className="flex flex-col gap-5 p-5">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">{task.name}</h2>

            <section aria-label="Properties" className="flex flex-col">
              <Property label="Status">
                {status ? <StatusBadge status={status.name} icon={status.icon} bgColor={status.color} size="small" /> : empty}
              </Property>
              <Property label="Assignees">
                {task.assignees.length > 0
                  ? asAvatars(task.assignees).map((user) => (
                      <span key={user.id} className="flex items-center gap-1.5 pr-2">
                        <UserAvatar user={user} size="xs" /> {user.name}
                      </span>
                    ))
                  : empty}
              </Property>
              <Property label="Dates">
                {task.startDate || task.dueDate ? (
                  <>
                    <DueDate iso={task.startDate} done />
                    {task.startDate && task.dueDate && <span className="text-muted-foreground">→</span>}
                    <DueDate iso={task.dueDate} done={status?.type === "done"} />
                  </>
                ) : (
                  empty
                )}
              </Property>
              <Property label="Priority">
                <PriorityFlag priority={task.priority} withLabel />
              </Property>
              <Property label="Sprint points">{task.points ?? empty}</Property>
              <Property label="Tags">
                {task.tags.length > 0 ? task.tags.map((tag) => <TagChip key={tag.name} tag={tag} />) : empty}
              </Property>
            </section>

            <section aria-label="Description" className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Description</h3>
              {task.description ? (
                <RichTextView content={task.description} />
              ) : (
                <p className="text-sm text-muted-foreground">No description.</p>
              )}
            </section>

            {task.subtasks.length > 0 && (
              <section aria-label="Subtasks" className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                  Subtasks{" "}
                  <span className="font-normal text-muted-foreground">
                    {task.subtaskDoneCount}/{task.subtaskCount}
                  </span>
                </h3>
                <ul className="flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-800">
                  {task.subtasks.map((sub) => {
                    const subStatus = statusById.get(sub.statusId);
                    return (
                      <li key={sub.id} className="border-b border-neutral-200 last:border-b-0 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => onOpenTask(sub.id)}
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        >
                          <span
                            aria-hidden
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: subStatus?.type === "done" ? "#22c55e" : subStatus?.type === "active" ? "#7b68ee" : "#a3a3a3" }}
                          />
                          <span className={subStatus?.type === "done" ? "text-muted-foreground line-through" : ""}>{sub.name}</span>
                          <span className="ml-auto flex items-center gap-2">
                            <DueDate iso={sub.dueDate} done={subStatus?.type === "done"} />
                            {sub.assignees[0] && <UserAvatar user={asAvatars(sub.assignees)[0]!} size="xs" />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

export default PublicTaskPanel;
