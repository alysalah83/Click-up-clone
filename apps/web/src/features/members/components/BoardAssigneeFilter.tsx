"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { create } from "zustand";
import { cn } from "@/shared/lib/utils/cn";
import type { Task } from "@/features/task/types";
import { useListMembers } from "../hooks/useMembers";
import { displayName } from "../lib/avatar";
import { UserAvatar } from "./UserAvatar";

interface AssigneeFilterStore {
  selectedIds: string[];
  toggle: (userId: string) => void;
  clear: () => void;
}

/** Board-only filter: show tasks assigned to any of the selected people. */
export const useAssigneeFilterStore = create<AssigneeFilterStore>((set) => ({
  selectedIds: [],
  toggle: (userId) =>
    set(({ selectedIds }) => ({
      selectedIds: selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId],
    })),
  clear: () => set({ selectedIds: [] }),
}));

export function matchesAssigneeFilter(task: Task, selectedIds: string[]) {
  if (selectedIds.length === 0) return true;
  return (task.assignees ?? []).some((a) => selectedIds.includes(a.id));
}

/** A row of avatar chips above the Board columns. */
function BoardAssigneeFilter() {
  const { listId } = useParams<{ listId: string }>();
  const { members } = useListMembers(listId);
  const { selectedIds, toggle, clear } = useAssigneeFilterStore();

  // A filter from another list would hide everything here.
  useEffect(() => clear, [listId, clear]);

  if (!members || members.length < 2) return null;

  return (
    <div className="flex items-center gap-2 px-3 pt-3 text-xs font-medium text-neutral-500 sm:px-4">
      <span>Assignee</span>
      <div className="flex items-center gap-1">
        {members.map((member) => {
          const user = { ...member, id: member.userId };
          const isSelected = selectedIds.includes(user.id);
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => toggle(user.id)}
              aria-pressed={isSelected}
              aria-label={`filter by ${displayName(user)}`}
              className={cn(
                "cursor-pointer rounded-full p-0.5 transition duration-200",
                isSelected
                  ? "ring-2 ring-violet-500"
                  : selectedIds.length > 0 && "opacity-50 hover:opacity-100",
              )}
            >
              <UserAvatar user={user} size="sm" />
            </button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="cursor-pointer rounded px-2 py-0.5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default BoardAssigneeFilter;
