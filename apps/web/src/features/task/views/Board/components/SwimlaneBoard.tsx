"use client";

import { memo, useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, Flag } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import StatusBadge from "@/features/status/components/StatusBadge";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import type { Status } from "@/features/status/types";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { TASK_PRIORITIES_LIST } from "@/features/task/constants/tasks.const";
import type { Task } from "@/features/task/types";
import { useViewTasks } from "@/features/viewConfig/hooks/useViewTasks";
import type { Swimlanes } from "@/features/viewConfig/types";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";
import { BOARD_STATUS_BACKGROUND_COLOR } from "../board.const";
import DragProvider from "../contexts/DragProvider";
import { buildLanes, cellId, Lane, wipState } from "../lib/swimlanes";
import BoardSkeleton from "./BoardSkeleton";
import ColumnMenu from "./ColumnMenu";
import TaskItem from "./TaskItem";
import WipCount from "./WipCount";

const COLUMN = "w-2xs shrink-0";

function ColumnHeader({ status, count, exceeded }: { status: Status; count: number; exceeded: boolean }) {
  return (
    <div
      className={cn(
        COLUMN,
        "flex snap-start items-center justify-between rounded-xl px-1.5 py-2",
        BOARD_STATUS_BACKGROUND_COLOR[status.bgColor as ColorsToken],
        exceeded && "ring-2 ring-red-400/70 dark:ring-red-500/60",
      )}
    >
      <div className="flex items-center gap-4">
        <StatusBadge status={status.name} icon={status.icon} bgColor={status.bgColor} />
        <WipCount count={count} limit={status.wipLimit} />
      </div>
      <ColumnMenu status={status} />
    </div>
  );
}

const Cell = memo(function Cell({
  status,
  lane,
  tasks,
  exceeded,
}: {
  status: Status;
  lane: Lane;
  tasks: Task[];
  exceeded: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: cellId(status.id, lane.key),
    data: { statusId: status.id, laneKey: lane.key },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        COLUMN,
        "flex min-h-16 flex-col gap-1 rounded-xl p-1.5 transition-all duration-200",
        BOARD_STATUS_BACKGROUND_COLOR[status.bgColor as ColorsToken],
        exceeded && "bg-red-500/5 ring-1 ring-red-400/50 dark:ring-red-500/40",
        isOver && "ring-2 ring-neutral-300 dark:ring-neutral-700",
      )}
    >
      {tasks.map((task) => (
        <TaskItem task={task} laneKey={lane.key} key={task.id} />
      ))}
    </div>
  );
});

function LaneIcon({ lane }: { lane: Lane }) {
  if (lane.assignee) return <UserAvatar user={lane.assignee} size="xs" />;
  if (lane.priority) {
    const color = TASK_PRIORITIES_LIST.find((p) => p.label.toLowerCase() === lane.priority)?.colorHex;
    return <Flag className="size-3.5" style={{ color: color ?? "#a3a3a3" }} fill={color ?? "none"} aria-hidden />;
  }
  return <span className="size-5 rounded-full border border-dashed border-neutral-400" aria-hidden />;
}

/** Status board split into horizontal swimlanes (by assignee or priority); columns keep their WIP limits. */
function SwimlaneBoard({ mode }: { mode: Exclude<Swimlanes, "none"> }) {
  const { statuses, isPending: statusesPending } = useStatuses();
  const { tasks, allTasks, isPending } = useViewTasks();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const lanes = useMemo(() => buildLanes(tasks ?? [], mode), [tasks, mode]);

  const columnStats = useMemo(
    () =>
      new Map(
        (statuses ?? []).map((s) => {
          const visible = (tasks ?? []).filter((t) => t.statusId === s.id).length;
          // WIP limits count the whole column, whatever the filters hide.
          const count = s.wipLimit ? (allTasks ?? []).filter((t) => t.statusId === s.id).length : visible;
          return [s.id, { count, exceeded: wipState(count, s.wipLimit) === "exceeded" }];
        }),
      ),
    [statuses, tasks, allTasks],
  );

  const toggle = (key: string) =>
    setCollapsed((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (isPending || statusesPending) return <BoardSkeleton columnCount={4} />;

  return (
    <section className="min-h-0 flex-1 snap-x snap-mandatory scroll-px-3 overflow-auto sm:snap-none">
      <div className="flex min-w-fit flex-col gap-3 px-3 pb-4 sm:px-4">
        <DragProvider swimlanes={mode} lanes={lanes}>
          <div className="dark:bg-neutral-925 sticky top-0 z-10 flex gap-4 bg-white pt-3 pb-1 sm:pt-4">
            {statuses?.map((status) => (
              <ColumnHeader
                key={status.id}
                status={status}
                count={columnStats.get(status.id)?.count ?? 0}
                exceeded={columnStats.get(status.id)?.exceeded ?? false}
              />
            ))}
          </div>
          {lanes.length === 0 && <p className="text-sm text-neutral-500">No tasks match the current filters.</p>}
          {lanes.map((lane) => {
            const isCollapsed = collapsed.has(lane.key);
            return (
              <div key={lane.key} className="flex flex-col gap-2" role="group" aria-label={`${lane.label} swimlane`}>
                <button
                  type="button"
                  onClick={() => toggle(lane.key)}
                  aria-expanded={!isCollapsed}
                  className="sticky left-3 flex w-fit cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-neutral-100 sm:left-4 dark:hover:bg-neutral-800"
                >
                  <ChevronRight
                    className={cn("size-4 text-neutral-500 transition-transform", !isCollapsed && "rotate-90")}
                    aria-hidden
                  />
                  <LaneIcon lane={lane} />
                  <span className="font-semibold">{lane.label}</span>
                  <span className="text-neutral-500 tabular-nums">{lane.tasks.length}</span>
                  {lane.points > 0 && (
                    <span className="rounded bg-neutral-100 px-1.5 text-xs text-neutral-600 tabular-nums dark:bg-neutral-800 dark:text-neutral-300">
                      {lane.points} pts
                    </span>
                  )}
                </button>
                {!isCollapsed && (
                  <div className="flex gap-4">
                    {statuses?.map((status) => (
                      <Cell
                        key={status.id}
                        status={status}
                        lane={lane}
                        tasks={lane.tasks.filter((t) => t.statusId === status.id)}
                        exceeded={columnStats.get(status.id)?.exceeded ?? false}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </DragProvider>
      </div>
    </section>
  );
}

export default SwimlaneBoard;
