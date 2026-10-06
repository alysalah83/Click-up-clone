"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { completeSprintAction } from "../actions";
import type { SprintSummary } from "../types";

const pts = (n: number) => `${n} pt${n === 1 ? "" : "s"}`;

function Stat({
  icon,
  label,
  count,
  points,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  points: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-2xl font-semibold tabular-nums">{count}</span>
      <span className="text-xs text-muted-foreground">
        {count === 1 ? "task" : "tasks"} · {pts(points)}
      </span>
    </div>
  );
}

/** "Complete sprint": shows done vs unfinished, then carries the unfinished tasks to the next sprint. */
function CompleteSprintDialog({ sprint }: { sprint: SprintSummary }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nextName = sprint.nextSprint?.name ?? `Sprint ${sprint.sprintNumber + 1}`;

  const complete = () =>
    startTransition(async () => {
      const response = await completeSprintAction(sprint.workspaceId, sprint.id);
      if (response.status === "error") {
        toast.error(formatErrorForToast(response.error));
        return;
      }
      if (!("payload" in response)) return;
      const { nextListId, nextName: movedTo, carriedCount } = response.payload;
      setOpen(false);
      toast.success(
        carriedCount > 0
          ? `${sprint.name} completed. ${carriedCount} unfinished ${carriedCount === 1 ? "task" : "tasks"} moved to ${movedTo}.`
          : `${sprint.name} completed. ${movedTo} is now active.`,
      );
      queryClient.invalidateQueries({ queryKey: ["tasks", sprint.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", nextListId] });
      router.push(`/home/lists/${nextListId}/board`);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="xs" className="bg-violet-600 text-white hover:bg-violet-700">
          <Flag />
          Complete sprint
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete {sprint.name}?</DialogTitle>
          <DialogDescription>
            {sprint.unfinishedCount > 0
              ? `Unfinished tasks move to ${nextName}${sprint.nextSprint ? "" : " (created now)"}, which becomes the active sprint. They stay in this sprint's history as carried over.`
              : `Everything is done. ${nextName}${sprint.nextSprint ? "" : " (created now)"} becomes the active sprint.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3">
          <Stat
            icon={<CheckCircle2 className="size-3.5 text-emerald-500" />}
            label="Done"
            count={sprint.doneCount}
            points={sprint.donePoints}
          />
          <Stat
            icon={<CircleDashed className="size-3.5 text-amber-500" />}
            label={`Carry to ${nextName}`}
            count={sprint.unfinishedCount}
            points={sprint.unfinishedPoints}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={complete} disabled={isPending} className="bg-violet-600 text-white hover:bg-violet-700">
            {isPending ? "Completing…" : "Complete sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CompleteSprintDialog;
