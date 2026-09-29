"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { cn } from "@/shared/lib/utils/cn";
import type { Task } from "@/features/task/types";
import { useListMembers } from "../hooks/useMembers";
import { useSetAssignees } from "../hooks/useSetAssignees";
import { displayName } from "../lib/avatar";
import { AvatarStack, UserAvatar } from "./UserAvatar";
import type { Assignee } from "../types";

/** Search the list's workspace members and toggle several of them as assignees. */
function AssigneePickerContent({ task }: { task: Task }) {
  const { listId } = useParams<{ listId: string }>();
  const { members, isPending } = useListMembers(listId ?? task.listId);
  const { setAssignees } = useSetAssignees();
  const [search, setSearch] = useState("");

  const assignees = task.assignees ?? [];
  const assignedIds = new Set(assignees.map((a) => a.id));
  const query = search.trim().toLowerCase();
  const filtered = (members ?? []).filter((m) =>
    `${displayName({ ...m, id: m.userId })} ${m.email ?? ""}`.toLowerCase().includes(query),
  );

  const toggle = (member: Assignee) => {
    const next = assignedIds.has(member.id)
      ? assignees.filter((a) => a.id !== member.id)
      : [...assignees, member];
    setAssignees({ taskId: task.id, assignees: next });
  };

  return (
    <section className="flex w-64 flex-col p-2" onClick={(e) => e.stopPropagation()}>
      <div className="mb-1 flex items-center gap-2 rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-600">
        <ICONS_MAP.search className="size-4 text-neutral-500" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search or enter name..."
          aria-label="search members"
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
        />
      </div>
      <p className="px-2 pt-1 pb-1 text-xs font-medium text-neutral-500">People</p>
      <menu className="flex max-h-64 flex-col overflow-y-auto">
        {isPending && <li className="px-2 py-1.5 text-sm text-neutral-500">Loading…</li>}
        {!isPending && filtered.length === 0 && (
          <li className="px-2 py-1.5 text-sm text-neutral-500">No members found</li>
        )}
        {filtered.map((member) => {
          const user: Assignee = {
            id: member.userId,
            name: member.name,
            email: member.email,
            avatarColor: member.avatarColor,
          };
          const isAssigned = assignedIds.has(user.id);
          return (
            <li key={member.userId}>
              <button
                type="button"
                onClick={() => toggle(user)}
                aria-pressed={isAssigned}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition duration-150 hover:bg-neutral-600/20 dark:hover:bg-neutral-500/20",
                  isAssigned && "bg-violet-500/10",
                )}
              >
                <UserAvatar user={user} size="sm" />
                <span className="flex-1 truncate text-neutral-800 dark:text-neutral-200">
                  {displayName(user)}
                </span>
                {isAssigned && <ICONS_MAP.checkMark className="size-4 text-violet-500" />}
              </button>
            </li>
          );
        })}
      </menu>
    </section>
  );
}

interface AssigneesButtonProps {
  task: Task;
  size?: "xs" | "sm";
  max?: number;
  /** Shown next to the empty-state icon (e.g. in the detail panel). */
  emptyLabel?: string;
  className?: string;
}

/** Avatars of the task's assignees; clicking opens the picker. */
export function AssigneesButton({ task, size = "sm", max = 3, emptyLabel, className }: AssigneesButtonProps) {
  const assignees = task.assignees ?? [];
  return (
    <Menu>
      <MenuTrigger>
        <button
          type="button"
          aria-label="assignees"
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-md text-sm text-neutral-500 transition duration-200 hover:opacity-80",
            className,
          )}
        >
          {assignees.length > 0 ? (
            <AvatarStack users={assignees} size={size} max={max} />
          ) : (
            <>
              <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-neutral-400 dark:border-neutral-600">
                <ICONS_MAP.user className="size-3.5" />
              </span>
              {emptyLabel && <span>{emptyLabel}</span>}
            </>
          )}
        </button>
      </MenuTrigger>
      <MenuContent>
        <AssigneePickerContent task={task} />
      </MenuContent>
    </Menu>
  );
}
