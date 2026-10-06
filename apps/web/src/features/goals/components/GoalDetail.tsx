"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Ellipsis, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceNames } from "@/features/docs/hooks/useDocs";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import { cn } from "@/shared/lib/utils/cn";
import { useDeleteGoal, useGoal, useUpdateGoal } from "../hooks";
import { dueLabel, goalHex } from "../lib";
import AddTargetDialog from "./AddTargetDialog";
import GoalFormDialog from "./GoalFormDialog";
import { ProgressRing } from "./GoalProgress";
import TargetRow from "./TargetRow";

function BackLink() {
  return (
    <Link
      href="/home/goals"
      className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> All goals
    </Link>
  );
}

/** A goal: header with its progress ring, then its targets with inline progress editing. */
function GoalDetail({ goalId }: { goalId: string }) {
  const router = useRouter();
  const { data: goal, isPending, error } = useGoal(goalId);
  const { data: spaces } = useWorkspaceNames();
  const update = useUpdateGoal(goalId);
  const remove = useDeleteGoal();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isPending)
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:p-8" aria-busy="true">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  if (error || !goal)
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-3 p-4 sm:p-8">
        <BackLink />
        <p className="text-sm text-muted-foreground">This goal does not exist or was deleted.</p>
      </div>
    );

  const color = goalHex(goal.color);
  const due = dueLabel(goal.dueDate);
  const space = spaces?.find((s) => s.id === goal.workspaceId);

  const deleteGoal = async () => {
    try {
      await remove.mutateAsync(goal.id);
      router.push("/home/goals");
    } catch {
      // Toasted by the mutation.
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-5 sm:px-8 sm:py-8">
      <BackLink />

      <header className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900">
        <ProgressRing progress={goal.progress} color={color} size={84} stroke={8} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <h1 className="min-w-0 flex-1 text-xl font-semibold">{goal.name}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost" aria-label="Goal options">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Pencil /> Edit goal
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                  <Trash /> Delete goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {goal.owner ? (
                <>
                  <UserAvatar user={goal.owner} size="xs" />
                  <span className="text-foreground">{displayName(goal.owner)}</span>
                </>
              ) : (
                "No owner"
              )}
            </span>
            {due && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  goal.progress < 1 && due.overdue && "font-medium text-red-500",
                )}
              >
                <CalendarDays className="size-3.5" />
                Due {due.text}
                {goal.progress < 1 && due.overdue && " (overdue)"}
              </span>
            )}
            {space && <span>Space: {space.name}</span>}
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Targets <span className="font-normal text-muted-foreground">({goal.targets.length})</span>
          </h2>
          <AddTargetDialog goalId={goal.id} workspaceId={goal.workspaceId} />
        </div>
        {goal.targets.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-muted-foreground dark:border-neutral-700">
            Add a target to start measuring this goal: a number, a true/false milestone, a currency amount or a set of
            tasks.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {goal.targets.map((t) => (
              <TargetRow key={t.id} goalId={goal.id} workspaceId={goal.workspaceId} target={t} color={color} />
            ))}
          </ul>
        )}
      </section>

      <GoalFormDialog
        key={goal.updatedAt}
        mode="edit"
        goal={goal}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={(patch) => update.mutateAsync(patch)}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this goal?</DialogTitle>
            <DialogDescription>
              “{goal.name}” and its targets are deleted. Linked tasks are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={remove.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteGoal} disabled={remove.isPending}>
              {remove.isPending ? "Deleting…" : "Delete goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GoalDetail;
