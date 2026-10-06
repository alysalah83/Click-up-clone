"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceNames } from "@/features/docs/hooks/useDocs";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import { cn } from "@/shared/lib/utils/cn";
import { useCreateGoal, useGoals } from "../hooks";
import { dueLabel, goalHex, percent } from "../lib";
import type { Goal } from "../types";
import GoalFormDialog from "./GoalFormDialog";
import { ProgressBar, ProgressRing } from "./GoalProgress";

function GoalCard({ goal }: { goal: Goal }) {
  const color = goalHex(goal.color);
  const due = dueLabel(goal.dueDate);
  const done = goal.progress >= 1;
  return (
    <li>
      <Link
        href={`/home/goals/${goal.id}`}
        className="group flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-violet-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <div className="flex items-start gap-3">
          <ProgressRing progress={goal.progress} color={color} size={52} />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400">
              {goal.name}
            </h3>
            {goal.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{goal.description}</p>
            )}
          </div>
        </div>
        <ProgressBar progress={goal.progress} color={color} />
        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
          {goal.owner ? (
            <span className="flex min-w-0 items-center gap-1.5" title={`Owner: ${displayName(goal.owner)}`}>
              <UserAvatar user={goal.owner} size="xs" />
              <span className="truncate">{displayName(goal.owner).split(" ")[0]}</span>
            </span>
          ) : (
            <span>No owner</span>
          )}
          <span className="flex shrink-0 items-center gap-1">
            <Target aria-hidden className="size-3.5" />
            {goal.targets.length} {goal.targets.length === 1 ? "target" : "targets"}
          </span>
          {due && (
            <span
              className={cn(
                "ml-auto flex shrink-0 items-center gap-1",
                !done && due.overdue && "font-medium text-red-500",
                !done && due.soon && "text-amber-600 dark:text-amber-400",
              )}
            >
              <CalendarDays aria-hidden className="size-3.5" />
              {due.text}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

function Summary({ goals }: { goals: Goal[] }) {
  const avg = goals.length ? goals.reduce((s, g) => s + g.progress, 0) / goals.length : 0;
  const completed = goals.filter((g) => g.progress >= 1).length;
  const overdue = goals.filter((g) => g.progress < 1 && dueLabel(g.dueDate)?.overdue).length;
  const stats = [
    { label: "Goals", value: String(goals.length) },
    { label: "Average progress", value: `${percent(avg)}%` },
    { label: "Completed", value: String(completed) },
    { label: "Overdue", value: String(overdue) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
          <dt className="text-xs text-muted-foreground">{s.label}</dt>
          <dd className="text-xl font-semibold tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Every goal, grouped by space, as cards with a progress ring. */
function GoalsHome() {
  const router = useRouter();
  const { data: goals, isPending, error } = useGoals();
  const { data: spaces } = useWorkspaceNames();
  const create = useCreateGoal();

  const createGoal = async (input: Parameters<typeof create.mutateAsync>[0]) => {
    const goal = await create.mutateAsync(input);
    router.push(`/home/goals/${goal.id}`);
  };

  const newGoalButton = (spaceId?: string, variant: "primary" | "outline" = "primary") => (
    <GoalFormDialog mode="create" spaces={spaces ?? []} defaultSpaceId={spaceId} onSubmit={createGoal}>
      {variant === "primary" ? (
        <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-700" disabled={!spaces?.length}>
          <Plus /> New goal
        </Button>
      ) : (
        <Button size="xs" variant="ghost" className="text-muted-foreground" disabled={!spaces?.length}>
          <Plus /> Add goal
        </Button>
      )}
    </GoalFormDialog>
  );

  if (isPending)
    return (
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    );
  if (error) return <p className="p-6 text-sm text-destructive">Could not load goals.</p>;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-5 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Goals</h1>
          <p className="text-sm text-muted-foreground">
            Track objectives with measurable targets. Task targets update as linked tasks are completed.
          </p>
        </div>
        {newGoalButton()}
      </div>
      {goals.length > 0 && <Summary goals={goals} />}
      {(spaces ?? []).map((space) => {
        const spaceGoals = goals.filter((g) => g.workspaceId === space.id);
        return (
          <section key={space.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">{space.name}</h2>
              {newGoalButton(space.id, "outline")}
            </div>
            {spaceGoals.length === 0 ? (
              <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-muted-foreground dark:border-neutral-700">
                No goals in this space yet.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spaceGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default GoalsHome;
