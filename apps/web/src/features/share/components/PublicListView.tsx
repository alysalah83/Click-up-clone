"use client";

import { useState } from "react";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import StatusBadge from "@/features/status/components/StatusBadge";
import { AvatarStack } from "@/features/members/components/UserAvatar";
import TagChip from "@/features/taskDetail/components/TagChip";
import { PointsBadge } from "@/features/sprint/components/PointsPicker";
import { BOARD_STATUS_BACKGROUND_COLOR } from "@/features/task/views/Board/board.const";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import type { ColorsToken } from "@/shared/ui/ColorPicker/types";
import { cn } from "@/shared/lib/utils/cn";
import { groupByStatus } from "../lib";
import type { PublicShareList, PublicShareStatus, PublicShareTask } from "../types";
import PublicTaskPanel from "./PublicTaskPanel";
import { DueDate, PriorityFlag, asAvatars } from "./TaskBits";

type Tab = "board" | "list";

function Card({ task, done, onOpen }: { task: PublicShareTask; done: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-px hover:border-indigo-600/40 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-600/50"
    >
      <span className="line-clamp-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">{task.name}</span>
      {(task.points !== null || task.tags.length > 0 || task.subtaskCount > 0) && (
        <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {task.points !== null && <PointsBadge points={task.points} />}
          {task.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag.name} tag={tag} size="xs" />
          ))}
          {task.subtaskCount > 0 && (
            <span className="flex items-center gap-0.5" title={`${task.subtaskDoneCount} of ${task.subtaskCount} subtasks done`}>
              <ICONS_MAP.rightArrow className="size-3" />
              {task.subtaskDoneCount}/{task.subtaskCount}
            </span>
          )}
        </span>
      )}
      <span className="flex items-center gap-2">
        <DueDate iso={task.dueDate} done={done} />
        <PriorityFlag priority={task.priority} />
        {task.assignees.length > 0 && <AvatarStack users={asAvatars(task.assignees)} size="xs" className="ml-auto" />}
      </span>
    </button>
  );
}

function Board({ groups, onOpen }: { groups: ReturnType<typeof groupByStatus>; onOpen: (id: string) => void }) {
  return (
    <div className="flex snap-x gap-3 overflow-x-auto px-3 pb-4 sm:px-6">
      {groups.map(({ status, tasks }) => (
        <section
          key={status.id}
          aria-label={status.name}
          className={cn(
            "flex h-fit w-[17rem] shrink-0 snap-start flex-col gap-1.5 rounded-xl px-1.5 pt-2.5 pb-1.5",
            BOARD_STATUS_BACKGROUND_COLOR[status.color as ColorsToken],
          )}
        >
          <header className="flex items-center gap-3 px-1 pb-1">
            <StatusBadge status={status.name} icon={status.icon} bgColor={status.color} size="small" />
            <span className="text-sm font-medium text-neutral-600 tabular-nums dark:text-neutral-400">{tasks.length}</span>
          </header>
          {tasks.map((task) => (
            <Card key={task.id} task={task} done={status.type === "done"} onOpen={() => onOpen(task.id)} />
          ))}
          {tasks.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">No tasks</p>}
        </section>
      ))}
    </div>
  );
}

function Rows({ groups, onOpen }: { groups: ReturnType<typeof groupByStatus>; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-6 px-3 pb-6 sm:px-6">
      {groups.map(({ status, tasks }) => (
        <section key={status.id} aria-label={status.name} className="flex flex-col gap-1">
          <header className="flex items-center gap-2">
            <StatusBadge status={status.name} icon={status.icon} bgColor={status.color} size="small" />
            <span className="text-sm font-medium text-neutral-600 tabular-nums dark:text-neutral-400">{tasks.length}</span>
          </header>
          <div className="hidden grid-cols-12 border-b border-neutral-200 px-2 py-1.5 text-xs font-medium text-muted-foreground sm:grid dark:border-neutral-800">
            <span className="col-span-6">Name</span>
            <span className="col-span-2">Assignee</span>
            <span className="col-span-2">Due date</span>
            <span className="col-span-1">Priority</span>
            <span className="col-span-1 text-right">Points</span>
          </div>
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpen(task.id)}
              className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-neutral-200 px-2 py-2 text-left text-sm transition hover:bg-neutral-100 sm:grid-cols-12 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
            >
              <span className="flex min-w-0 items-center gap-2 sm:col-span-6">
                <span className="truncate font-medium">{task.name}</span>
                {task.subtaskCount > 0 && (
                  <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground">
                    <ICONS_MAP.rightArrow className="size-3" />
                    {task.subtaskCount}
                  </span>
                )}
                {task.tags.slice(0, 2).map((tag) => (
                  <TagChip key={tag.name} tag={tag} size="xs" className="hidden md:inline-flex" />
                ))}
              </span>
              <span className="justify-self-end sm:col-span-2 sm:justify-self-start">
                {task.assignees.length > 0 ? (
                  <AvatarStack users={asAvatars(task.assignees)} size="xs" />
                ) : (
                  <span className="hidden text-xs text-muted-foreground sm:inline">-</span>
                )}
              </span>
              <span className="flex items-center gap-3 sm:contents">
                <span className="sm:col-span-2">
                  <DueDate iso={task.dueDate} done={status.type === "done"} />
                </span>
                <span className="sm:col-span-1">
                  <PriorityFlag priority={task.priority} withLabel />
                </span>
                <span className="text-xs text-muted-foreground tabular-nums sm:col-span-1 sm:text-right">
                  {task.points ?? ""}
                </span>
              </span>
            </button>
          ))}
          {tasks.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">No tasks</p>}
        </section>
      ))}
    </div>
  );
}

/** The shared list: Board and List tabs, and a read-only task panel. Nothing here can edit. */
function PublicListView({ token, list }: { token: string; list: PublicShareList }) {
  const [tab, setTab] = useState<Tab>("board");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const groups = groupByStatus(list.statuses, list.tasks);
  const statusById = new Map<string, PublicShareStatus>(list.statuses.map((s) => [s.id, s]));

  const tabs: { id: Tab; label: string; Icon: typeof LayoutGrid }[] = [
    { id: "board", label: "Board", Icon: LayoutGrid },
    { id: "list", label: "List", Icon: ListIcon },
  ];

  return (
    <>
      <div className="flex items-center gap-1 border-b border-neutral-200 px-3 sm:px-6 dark:border-neutral-800" role="tablist" aria-label="Views">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition",
              tab === id
                ? "border-violet-600 text-violet-700 dark:text-violet-300"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {list.tasks.length} task{list.tasks.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="pt-4">
        {tab === "board" ? <Board groups={groups} onOpen={setOpenTaskId} /> : <Rows groups={groups} onOpen={setOpenTaskId} />}
      </div>
      {openTaskId && (
        <PublicTaskPanel
          key={openTaskId}
          token={token}
          taskId={openTaskId}
          statusById={statusById}
          onOpenTask={setOpenTaskId}
          onClose={() => setOpenTaskId(null)}
        />
      )}
    </>
  );
}

export default PublicListView;
