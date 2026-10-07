"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/lib/utils/cn";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { useListMembers } from "@/features/members/hooks/useMembers";
import { displayName } from "@/features/members/lib/avatar";
import useTasks from "@/features/task/hooks/useTasks";
import { useSavedViews } from "../hooks/useSavedViews";
import { countActiveFilters, DEFAULT_CONFIG, UNASSIGNED } from "../lib/applyViewConfig";
import { useViewConfigStore } from "../store";
import type { DueKind, GroupBy, Swimlanes } from "../types";
import { CustomFieldFilters } from "@/features/customFields/components/CustomFieldFilters";

const chip =
  "inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800";
const chipActive = "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-950 dark:text-violet-300";

interface Option {
  value: string;
  label: string;
}

function MultiFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const active = selected.length > 0;
  return (
    <Popover>
      <PopoverTrigger className={cn(chip, active && chipActive)}>
        {label}
        {active && <span className="tabular-nums">· {selected.length}</span>}
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-56 overflow-y-auto p-1">
        {options.length === 0 && <p className="p-2 text-xs text-neutral-500">Nothing to filter by</p>}
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() =>
                onChange(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value])
              }
            />
            <span className="truncate">{o.label}</span>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

const DUE_OPTIONS: { kind: DueKind; label: string }[] = [
  { kind: "overdue", label: "Overdue" },
  { kind: "today", label: "Today" },
  { kind: "week", label: "This week" },
  { kind: "none", label: "No due date" },
  { kind: "custom", label: "Custom range" },
];

function DueFilterControl() {
  const due = useViewConfigStore((s) => s.filters.due);
  const setFilters = useViewConfigStore((s) => s.setFilters);
  const current = DUE_OPTIONS.find((o) => o.kind === due?.kind);
  return (
    <Popover>
      <PopoverTrigger className={cn(chip, due && chipActive)}>
        Due date{current && <span>· {current.label}</span>}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {DUE_OPTIONS.map((o) => (
          <button
            key={o.kind}
            type="button"
            onClick={() => setFilters({ due: due?.kind === o.kind ? null : { kind: o.kind } })}
            className={cn(
              "flex w-full cursor-pointer rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
              due?.kind === o.kind && "font-semibold text-violet-600",
            )}
          >
            {o.label}
          </button>
        ))}
        {due?.kind === "custom" && (
          <div className="flex flex-col gap-1 p-2 text-xs">
            <label className="flex items-center justify-between gap-2">
              From
              <input
                type="date"
                value={due.from ?? ""}
                onChange={(e) => setFilters({ due: { ...due, from: e.target.value || undefined } })}
                className="rounded border px-1 dark:bg-transparent"
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              To
              <input
                type="date"
                value={due.to ?? ""}
                onChange={(e) => setFilters({ due: { ...due, to: e.target.value || undefined } })}
                className="rounded border px-1 dark:bg-transparent"
              />
            </label>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SavedViewsMenu({ listId }: { listId: string }) {
  const { views, create, update, remove } = useSavedViews(listId);
  const { filters, groupBy, swimlanes, sort, activeViewId, load } = useViewConfigStore();
  const [name, setName] = useState("");
  const active = views?.find((v) => v.id === activeViewId);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      { name: trimmed, config: { filters, groupBy, swimlanes, sort } },
      {
        onSuccess: (view) => {
          load(view.config, view.id);
          setName("");
        },
      },
    );
  };

  return (
    <Popover>
      <PopoverTrigger className={cn(chip, active && chipActive)}>{active ? active.name : "Saved views"}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[90vw] p-2">
        {views?.length ? (
          <ul className="mb-2 flex flex-col">
            {views.map((v) => (
              <li key={v.id} className="group flex items-center gap-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <button
                  type="button"
                  onClick={() => load(v.config, v.id)}
                  className={cn("min-w-0 flex-1 cursor-pointer truncate px-2 py-1.5 text-left text-sm", v.id === activeViewId && "font-semibold text-violet-600")}
                >
                  {v.name}
                  {v.isDefault && <span className="ml-1 text-xs text-neutral-500">(default)</span>}
                </button>
                <button
                  type="button"
                  className="shrink-0 cursor-pointer whitespace-nowrap rounded px-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                  onClick={() => update.mutate({ id: v.id, isDefault: !v.isDefault })}
                >
                  {v.isDefault ? "Unset default" : "Set default"}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${v.name}`}
                  className="shrink-0 cursor-pointer rounded px-1.5 text-xs text-red-600"
                  onClick={() => remove.mutate(v.id, { onSuccess: () => v.id === activeViewId && load({ filters, groupBy, swimlanes, sort }, null) })}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-2 px-2 text-xs text-neutral-500">No saved views yet.</p>
        )}
        <form
          className="flex gap-1 border-t pt-2 dark:border-neutral-800"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Save current as…"
            className="min-w-0 flex-1 rounded border px-2 py-1 text-sm dark:bg-transparent"
          />
          <button
            type="submit"
            disabled={!name.trim() || create.isPending}
            className="cursor-pointer rounded bg-violet-600 px-2 text-sm text-white disabled:opacity-50"
          >
            Save
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/** Filter bar + Group by + saved views, shown above the List, Board and Table views. */
export function ViewToolbar({ groupable = false, swimlanable = false }: { groupable?: boolean; swimlanable?: boolean }) {
  const { listId } = useParams<{ listId: string }>();
  const { statuses } = useStatuses();
  const { members } = useListMembers(listId);
  const { tasks } = useTasks();
  const { views, isPending: viewsPending } = useSavedViews(listId);
  const { filters, groupBy, swimlanes, appliedListId, setFilters, setGroupBy, setSwimlanes, clearFilters, load } =
    useViewConfigStore();

  // Opening a list applies its default saved view (or resets a config left over from another list).
  useEffect(() => {
    if (viewsPending || appliedListId === listId) return;
    const def = views?.find((v) => v.isDefault);
    load(def?.config ?? DEFAULT_CONFIG, def?.id ?? null, listId);
  }, [viewsPending, views, listId, appliedListId, load]);

  const tagOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of tasks ?? []) for (const tag of t.tags ?? []) seen.set(tag.id, tag.name);
    return [...seen].map(([value, label]) => ({ value, label }));
  }, [tasks]);

  const assigneeOptions: Option[] = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...(members ?? []).map((m) => ({ value: m.userId, label: displayName({ ...m, id: m.userId }) })),
  ];
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 pt-3 sm:px-4" role="toolbar" aria-label="View filters">
      <MultiFilter label="Assignee" options={assigneeOptions} selected={filters.assignees} onChange={(assignees) => setFilters({ assignees })} />
      <MultiFilter
        label="Status"
        options={(statuses ?? []).map((s) => ({ value: s.id, label: s.name }))}
        selected={filters.statuses}
        onChange={(next) => setFilters({ statuses: next })}
      />
      <MultiFilter
        label="Priority"
        options={["urgent", "high", "normal", "low", "none"].map((p) => ({ value: p, label: p[0]!.toUpperCase() + p.slice(1) }))}
        selected={filters.priorities}
        onChange={(next) => setFilters({ priorities: next as typeof filters.priorities })}
      />
      <MultiFilter label="Tag" options={tagOptions} selected={filters.tags} onChange={(tags) => setFilters({ tags })} />
      <DueFilterControl />
      <CustomFieldFilters listId={listId} />
      {activeCount > 0 && (
        <button type="button" onClick={clearFilters} className="cursor-pointer text-xs text-neutral-500 hover:underline">
          Clear
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {groupable && (
          <label className="flex items-center gap-1 text-xs font-medium text-neutral-500">
            Group by
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="h-7 rounded-md border border-neutral-200 bg-transparent px-1 text-xs dark:border-neutral-800"
            >
              <option value="status">Status</option>
              <option value="assignee">Assignee</option>
              <option value="priority">Priority</option>
              <option value="tag">Tag</option>
            </select>
          </label>
        )}
        {swimlanable && groupBy === "status" && (
          <label className="flex items-center gap-1 text-xs font-medium text-neutral-500">
            Swimlanes
            <select
              aria-label="Swimlanes"
              value={swimlanes}
              onChange={(e) => setSwimlanes(e.target.value as Swimlanes)}
              className={cn(
                "h-7 rounded-md border border-neutral-200 bg-transparent px-1 text-xs dark:border-neutral-800",
                swimlanes !== "none" && "border-violet-400 text-violet-700 dark:border-violet-500 dark:text-violet-300",
              )}
            >
              <option value="none">None</option>
              <option value="assignee">Assignee</option>
              <option value="priority">Priority</option>
            </select>
          </label>
        )}
        <SavedViewsMenu listId={listId} />
      </div>
    </div>
  );
}
