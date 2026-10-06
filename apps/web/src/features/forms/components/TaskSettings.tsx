"use client";

import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { useListMembers } from "@/features/members/hooks/useMembers";
import { useWorkspaceTags } from "@/features/taskDetail/hooks/useTaskDetail";
import TagChip from "@/features/taskDetail/components/TagChip";
import type { FormDraft } from "../types";

const NONE = "__none";
const smallLabel = "text-[11px] font-medium tracking-wide text-neutral-500 uppercase";
const PRIORITIES = ["none", "urgent", "high", "normal", "low"] as const;

/** Defaults of the tasks a submission creates: status, priority (when no field sets it), assignee, tags. */
function TaskSettings({
  listId,
  workspaceId,
  draft,
  onChange,
}: {
  listId: string;
  workspaceId: string;
  draft: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
}) {
  const { statuses } = useStatuses();
  const { members } = useListMembers(listId);
  const tags = useWorkspaceTags(workspaceId);
  const ordered = [...(statuses ?? [])].sort((a, b) => a.order - b.order);
  const openName = ordered.find((s) => s.type === "open")?.name ?? "open";
  const selectedTags = tags.filter((t) => draft.tagIds.includes(t.id));
  const hasPriorityField = draft.fields.some((f) => f.mapTo === "priority");

  const toggleTag = (id: string) =>
    onChange({ tagIds: draft.tagIds.includes(id) ? draft.tagIds.filter((t) => t !== id) : [...draft.tagIds, id].slice(0, 10) });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className={smallLabel}>Status</span>
        <Select value={draft.statusId ?? NONE} onValueChange={(v) => onChange({ statusId: v === NONE ? null : v })}>
          <SelectTrigger size="sm" className="w-full capitalize" aria-label="Status of new tasks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE} className="capitalize">
              Default ({openName})
            </SelectItem>
            {ordered.map((s) => (
              <SelectItem key={s.id} value={s.id} className="capitalize">
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1">
        <span className={smallLabel}>Priority{hasPriorityField ? " (if not answered)" : ""}</span>
        <Select value={draft.priority} onValueChange={(v) => onChange({ priority: v as FormDraft["priority"] })}>
          <SelectTrigger size="sm" className="w-full capitalize" aria-label="Default priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">
                {p === "none" ? "No priority" : p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1">
        <span className={smallLabel}>Assignee</span>
        <Select value={draft.assigneeId ?? NONE} onValueChange={(v) => onChange({ assigneeId: v === NONE ? null : v })}>
          <SelectTrigger size="sm" className="w-full" aria-label="Assignee of new tasks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Unassigned</SelectItem>
            {(members ?? []).map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.name ?? m.email ?? "Member"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="flex flex-col gap-1">
        <span className={smallLabel}>Tags</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Tags of new tasks"
              className="flex min-h-8 w-full items-center gap-1 rounded-md border border-input px-2 py-1 text-left text-sm shadow-xs dark:bg-input/30"
            >
              <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                {selectedTags.length ? (
                  selectedTags.map((t) => <TagChip key={t.id} tag={t} size="xs" />)
                ) : (
                  <span className="text-muted-foreground">No tags</span>
                )}
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            {tags.length === 0 && <p className="p-2 text-xs text-neutral-500">This space has no tags yet.</p>}
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <span className="grid size-4 place-items-center">
                  {draft.tagIds.includes(t.id) && <Check className="size-3.5 text-violet-600" />}
                </span>
                <TagChip tag={t} size="xs" />
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default TaskSettings;
