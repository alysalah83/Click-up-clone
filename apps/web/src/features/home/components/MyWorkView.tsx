"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStatusesClient } from "@/features/status/api/status.client";
import { updateTaskAction } from "@/features/task/actions";
import StatusBadge from "@/features/status/components/StatusBadge";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import type { ActionErrorResponse } from "@/shared/types/action.types";
import { useMyWork } from "../hooks/useMyWork";
import type { MyWorkBucket, MyWorkTask } from "../types";

const SECTIONS: { bucket: MyWorkBucket; label: string; tone: string; startOpen: boolean }[] = [
  { bucket: "overdue", label: "Overdue", tone: "text-red-500", startOpen: true },
  { bucket: "today", label: "Today", tone: "text-emerald-500", startOpen: true },
  { bucket: "upcoming", label: "Upcoming", tone: "text-sky-500", startOpen: true },
  { bucket: "nodate", label: "No date", tone: "text-muted-foreground", startOpen: false },
];

const PRIORITY_COLOR: Record<MyWorkTask["priority"], string> = {
  urgent: "text-red-500",
  high: "text-amber-500",
  normal: "text-sky-500",
  low: "text-neutral-400",
  none: "text-neutral-500",
};

function MyWorkView() {
  const { data, isPending, error } = useMyWork();
  const [showDone, setShowDone] = useState(false);

  if (isPending)
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4" aria-busy="true">
        <Skeleton className="h-7 w-28" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  if (error) return <p className="p-6 text-sm text-destructive">Could not load your tasks.</p>;

  const tasks = showDone ? data : data.filter((t) => t.status.type !== "done");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Work</h1>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={showDone} onCheckedChange={(v) => setShowDone(v === true)} />
          Show completed
        </label>
      </div>
      {SECTIONS.map((s) => (
        <Section key={s.bucket} {...s} tasks={tasks.filter((t) => t.bucket === s.bucket)} />
      ))}
    </div>
  );
}

function Section({
  label,
  tone,
  startOpen,
  tasks,
}: {
  label: string;
  tone: string;
  startOpen: boolean;
  tasks: MyWorkTask[];
}) {
  const [open, setOpen] = useState(startOpen);
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold"
      >
        <span className="text-xs">{open ? "▾" : "▸"}</span>
        <span className={tone}>{label}</span>
        <Badge variant="secondary">{tasks.length}</Badge>
      </button>
      {open && (
        <ul className="divide-y border-t">
          {tasks.length === 0 && (
            <li className="flex items-center justify-center gap-2 px-3 py-5 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Nothing here.
            </li>
          )}
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskRow({ task }: { task: MyWorkTask }) {
  const due = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;
  return (
    <li className="flex items-center gap-3 px-3 py-2 text-sm">
      <StatusChanger task={task} />
      <Link
        href={`/home/lists/${task.list.id}/board?task=${task.id}`}
        className={`min-w-0 flex-1 truncate font-medium hover:text-primary ${task.status.type === "done" ? "line-through opacity-60" : ""}`}
      >
        {task.name}
      </Link>
      <span className={`text-xs capitalize ${PRIORITY_COLOR[task.priority]}`}>
        {task.priority === "none" ? "-" : task.priority}
      </span>
      <span className={`w-16 text-xs ${task.bucket === "overdue" ? "text-destructive" : "text-muted-foreground"}`}>
        {due ?? "-"}
      </span>
      <Link
        href={`/home/lists/${task.list.id}/board`}
        className="hidden w-32 truncate text-xs text-muted-foreground hover:underline sm:block"
      >
        {task.list.name}
      </Link>
    </li>
  );
}

function StatusChanger({ task }: { task: MyWorkTask }) {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const { data: statuses } = useQuery({
    queryKey: ["statuses", task.list.id],
    queryFn: () => getStatusesClient(task.list.id),
    enabled: editing,
  });
  const { mutate } = useMutation({
    mutationFn: async (statusId: string) => {
      const res = await updateTaskAction(task.id, { statusId }, task.list.id);
      if (res.status === "error") throw res;
    },
    onError: (e: ActionErrorResponse) => window.toast?.error(formatErrorForToast(e.error), 7),
    onSettled: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["my-work"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", task.list.id] });
    },
  });

  if (editing)
    return (
      <select
        autoFocus
        aria-label="Change status"
        defaultValue={task.status.id}
        onBlur={() => setEditing(false)}
        onChange={(e) => mutate(e.target.value)}
        className="w-32 shrink-0 rounded-md border border-input bg-background px-1 py-0.5 text-xs uppercase"
      >
        {(statuses ?? [{ id: task.status.id, name: task.status.name }]).map((s) => (
          <option key={s.id} value={s.id} className="text-black">
            {s.name}
          </option>
        ))}
      </select>
    );

  return (
    <button
      type="button"
      aria-label={`Status ${task.status.name}, change`}
      onClick={() => setEditing(true)}
      className="w-32 shrink-0"
    >
      <StatusBadge status={task.status.name} icon={task.status.icon} bgColor={task.status.bgColor} size="small" />
    </button>
  );
}

export default MyWorkView;
