"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, IterationCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils/cn";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { createSprintAction } from "../actions";
import { sprintRange, type SprintList } from "../lib";
import SprintStateBadge from "./SprintStateBadge";

function SprintRow({ sprint }: { sprint: SprintList }) {
  const { listId } = useParams<{ listId?: string }>();
  const active = listId === sprint.id;
  const completed = sprint.sprintState === "completed";

  return (
    <li>
      <Link
        href={`/home/lists/${sprint.id}/board`}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-500/15",
          active && "bg-neutral-900/10 dark:bg-neutral-200/10",
        )}
      >
        <IterationCw
          aria-hidden
          className={cn(
            "size-3.5 shrink-0",
            sprint.sprintState === "active" ? "text-violet-500" : "text-neutral-400",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={cn("truncate", completed ? "text-neutral-500" : "font-medium")}>{sprint.name}</span>
            {sprint.sprintState === "active" && <SprintStateBadge state="active" />}
          </span>
          <span className="block truncate text-[11px] text-neutral-500">
            {sprintRange(sprint.sprintStart, sprint.sprintEnd)}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** The space's "Sprints" folder in the sidebar: sprint lists by number, with "New sprint". */
function SprintsTree({ workspaceId, sprints }: { workspaceId: string; sprints: SprintList[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const addSprint = () =>
    startTransition(async () => {
      const response = await createSprintAction(workspaceId);
      if (response.status === "error") {
        toast.error(formatErrorForToast(response.error));
        return;
      }
      if ("payload" in response) {
        toast.success("Sprint created");
        router.push(`/home/lists/${response.payload.listId}/board`);
      }
    });

  return (
    <div className="ml-auto flex w-[92%] flex-col gap-1 border-l border-neutral-300 pl-3 dark:border-neutral-700">
      <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex cursor-pointer items-center gap-1 rounded hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          <ChevronRight aria-hidden className={cn("size-3.5 transition-transform", open && "rotate-90")} />
          Sprints
        </button>
        <button
          type="button"
          aria-label="New sprint"
          title="New sprint"
          onClick={addSprint}
          disabled={isPending}
          className="flex size-6 cursor-pointer items-center justify-center rounded hover:bg-neutral-500/20 disabled:opacity-50"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {open && sprints.length === 0 && (
        <button
          type="button"
          onClick={addSprint}
          disabled={isPending}
          className="cursor-pointer rounded-md px-1 py-1 text-left text-xs text-neutral-500 hover:bg-neutral-500/15"
        >
          + New sprint
        </button>
      )}
      {open && sprints.length > 0 && (
        <ul className="flex flex-col">
          {sprints.map((sprint) => (
            <SprintRow key={sprint.id} sprint={sprint} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default SprintsTree;
