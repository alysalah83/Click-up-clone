"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { skipToken, useQuery } from "@tanstack/react-query";
import { ChartLine, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { List } from "@/features/list/types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { createSprintAction } from "../actions";
import { useSprintSummary } from "../hooks";
import { daysLeft, isSprintList } from "../lib";
import CompleteSprintDialog from "./CompleteSprintDialog";

/** The list cached by ListIdDataLayer (never fetched from the client). */
export function useCurrentList() {
  const { listId } = useParams<{ listId?: string }>();
  const { data } = useQuery<List>({ queryKey: ["list", listId], queryFn: skipToken });
  return data && data.id === listId ? data : undefined;
}

function daysLeftLabel(end: string) {
  const n = daysLeft(end);
  if (n < 0) return "Ended";
  if (n === 0) return "Last day";
  return `${n} day${n === 1 ? "" : "s"} left`;
}

/**
 * Sprint strip under the list title: points progress, days left, the report link and the
 * "Complete sprint" / "New sprint" actions. Renders nothing on plain lists.
 */
function SprintBar() {
  const list = useCurrentList();
  const isSprint = isSprintList(list);
  const { data: sprint } = useSprintSummary(list?.id, isSprint);
  const pathname = usePathname();
  const router = useRouter();
  const [isCreating, startTransition] = useTransition();
  if (!isSprint || !sprint) return null;

  const percent = sprint.totalPoints ? Math.round((sprint.donePoints / sprint.totalPoints) * 100) : 0;
  const onReport = pathname.endsWith("/sprint");

  const newSprint = () =>
    startTransition(async () => {
      const response = await createSprintAction(sprint.workspaceId);
      if (response.status === "error") return void toast.error(formatErrorForToast(response.error));
      if ("payload" in response) router.push(`/home/lists/${response.payload.listId}/board`);
    });

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-600 dark:text-neutral-400">
      <div className="flex items-center gap-2" title={`${sprint.donePoints} of ${sprint.totalPoints} points done`}>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
        <span className="font-semibold text-neutral-800 tabular-nums dark:text-neutral-200">
          {sprint.donePoints}/{sprint.totalPoints} pts
        </span>
        <span className="tabular-nums">
          · {sprint.doneCount}/{sprint.taskCount} tasks
        </span>
      </div>
      {sprint.sprintState === "active" && <span>{daysLeftLabel(sprint.sprintEnd)}</span>}
      {sprint.sprintState === "planned" && <span>Starts later</span>}
      <div className="ml-auto flex items-center gap-2">
        {!onReport && (
          <Button asChild size="xs" variant="outline">
            <Link href={`/home/lists/${sprint.id}/sprint`}>
              <ChartLine />
              Sprint report
            </Link>
          </Button>
        )}
        {sprint.sprintState === "active" && <CompleteSprintDialog sprint={sprint} />}
        {!sprint.nextSprint && (
          <Button size="xs" variant="outline" onClick={newSprint} disabled={isCreating}>
            <Plus />
            New sprint
          </Button>
        )}
      </div>
    </div>
  );
}

export default SprintBar;
