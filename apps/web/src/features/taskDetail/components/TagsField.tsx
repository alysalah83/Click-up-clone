"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { cn } from "@/shared/lib/utils/cn";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import {
  addTagToTaskAction,
  createTagAction,
  removeTagFromTaskAction,
} from "../actions/taskDetail.actions";
import {
  useTaskDetailMutation,
  useWorkspaceTags,
} from "../hooks/useTaskDetail";
import type { TaskDetail, TaskTag } from "../types";
import TagChip from "./TagChip";

export const TAG_COLORS = [
  "#2b7fff",
  "#4f39f6",
  "#e7000b",
  "#c800de",
  "#e17100",
  "#009689",
  "#007a55",
  "#0092b8",
  "#497d00",
];

const byName = (a: TaskTag, b: TaskTag) => a.name.localeCompare(b.name);

function TagsField({ detail }: { detail: TaskDetail }) {
  const { id: taskId, listId, workspace } = detail;
  const workspaceTags = useWorkspaceTags(workspace.id);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const add = useTaskDetailMutation(
    taskId,
    listId,
    (tag: TaskTag) => addTagToTaskAction(taskId, tag.id, listId),
    (d, tag) => ({ ...d, tags: [...d.tags, tag].sort(byName) }),
  );
  const remove = useTaskDetailMutation(
    taskId,
    listId,
    (tag: TaskTag) => removeTagFromTaskAction(taskId, tag.id, listId),
    (d, tag) => ({ ...d, tags: d.tags.filter((t) => t.id !== tag.id) }),
  );

  const assigned = new Set(detail.tags.map((t) => t.id));
  const query = search.trim().toLowerCase();
  const filtered = workspaceTags.filter((t) => t.name.includes(query));
  const canCreate =
    query.length > 0 && !workspaceTags.some((t) => t.name === query);

  const createAndAdd = async () => {
    setIsCreating(true);
    const color = TAG_COLORS[workspaceTags.length % TAG_COLORS.length]!;
    const response = await createTagAction(workspace.id, query, color, listId);
    setIsCreating(false);
    if (response.status === "error") {
      window.toast?.error(formatErrorForToast(response.error), 7);
      return;
    }
    if (!("payload" in response)) return;
    queryClient.invalidateQueries({ queryKey: ["tags", workspace.id] });
    add.mutate(response.payload as TaskTag);
    setSearch("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {detail.tags.map((tag) => (
        <TagChip key={tag.id} tag={tag} onRemove={() => remove.mutate(tag)} />
      ))}
      <Menu>
        <MenuTrigger>
          <button
            type="button"
            aria-label="add tag"
            className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <ICONS_MAP.plus className="size-3" />
            {detail.tags.length === 0 && "Add tag"}
          </button>
        </MenuTrigger>
        <MenuContent>
          <section className="flex w-60 flex-col p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate && !isCreating)
                  createAndAdd();
              }}
              placeholder="Search or create tags..."
              aria-label="search tags"
              maxLength={32}
              className="mb-1 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-neutral-500 dark:border-neutral-600"
            />
            <menu className="flex max-h-60 flex-col overflow-y-auto">
              {filtered.map((tag) => {
                const isOn = assigned.has(tag.id);
                return (
                  <li key={tag.id}>
                    <button
                      type="button"
                      aria-pressed={isOn}
                      onClick={() =>
                        isOn ? remove.mutate(tag) : add.mutate(tag)
                      }
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-neutral-600/20",
                        isOn && "bg-violet-500/10",
                      )}
                    >
                      <TagChip tag={tag} />
                      {isOn && (
                        <ICONS_MAP.checkMark className="size-4 text-violet-500" />
                      )}
                    </button>
                  </li>
                );
              })}
              {canCreate && (
                <li>
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={createAndAdd}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-neutral-600 hover:bg-neutral-600/20 disabled:opacity-60 dark:text-neutral-300"
                  >
                    <ICONS_MAP.plus className="size-3" />
                    Create tag{" "}
                    <span className="font-medium">&ldquo;{query}&rdquo;</span>
                  </button>
                </li>
              )}
              {!canCreate && filtered.length === 0 && (
                <li className="px-2 py-1.5 text-neutral-500">
                  Type to create a tag
                </li>
              )}
            </menu>
          </section>
        </MenuContent>
      </Menu>
    </div>
  );
}

export default TagsField;
