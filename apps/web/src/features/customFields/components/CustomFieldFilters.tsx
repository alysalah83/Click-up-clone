"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/lib/utils/cn";
import { useListMembers } from "@/features/members/hooks/useMembers";
import { displayName } from "@/features/members/lib/avatar";
import { useViewConfigStore } from "@/features/viewConfig/store";
import type { CustomFilter } from "@/features/viewConfig/types";
import { useCustomFields } from "../hooks";
import { FILTER_OPS, filterIsComplete } from "../lib";
import type { CustomField } from "../types";
import FieldTypeIcon from "./FieldTypeIcon";
import { OptionPill } from "./ValueEditor";

const select =
  "h-7 min-w-0 rounded-md border border-neutral-200 bg-transparent px-1 text-xs dark:border-neutral-700 dark:bg-neutral-900";
const input =
  "h-7 min-w-0 rounded-md border border-neutral-200 bg-transparent px-2 text-xs outline-none focus:border-violet-400 dark:border-neutral-700";

function MultiPick({
  items,
  selected,
  onChange,
}: {
  items: { id: string; label: ReactNode }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex max-h-36 flex-col overflow-y-auto rounded-md border border-neutral-200 p-1 dark:border-neutral-700">
      {items.length === 0 && <span className="p-1 text-xs text-neutral-500">Nothing to pick</span>}
      {items.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => onChange(selected.includes(item.id) ? selected.filter((v) => v !== item.id) : [...selected, item.id])}
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}

function FilterValue({
  field,
  filter,
  listId,
  onChange,
}: {
  field: CustomField;
  filter: CustomFilter;
  listId: string;
  onChange: (value: CustomFilter["value"]) => void;
}) {
  const { members } = useListMembers(field.type === "people" ? listId : undefined);
  if (["set", "empty", "checked", "unchecked"].includes(filter.op)) return null;
  const list = Array.isArray(filter.value) ? filter.value : [];
  switch (field.type) {
    case "dropdown":
      return (
        <MultiPick
          items={(field.config.options ?? []).map((o) => ({ id: o.id, label: <OptionPill option={o} /> }))}
          selected={list}
          onChange={onChange}
        />
      );
    case "people":
      return (
        <MultiPick
          items={(members ?? []).map((m) => ({ id: m.userId, label: displayName({ ...m, id: m.userId }) }))}
          selected={list}
          onChange={onChange}
        />
      );
    case "date":
      return (
        <input
          type="date"
          aria-label="date"
          value={typeof filter.value === "string" ? filter.value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={input}
        />
      );
    case "text":
      return (
        <input
          aria-label="text"
          placeholder="Text…"
          value={typeof filter.value === "string" ? filter.value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={input}
        />
      );
    default:
      return (
        <input
          type="number"
          step="any"
          aria-label="number"
          placeholder="0"
          value={filter.value === undefined || Array.isArray(filter.value) ? "" : String(filter.value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className={cn(input, "w-24 tabular-nums")}
        />
      );
  }
}

/** The "Fields" chip of the filter bar: filters and sorting by the list's custom fields. */
export function CustomFieldFilters({ listId }: { listId: string }) {
  const { fields } = useCustomFields(listId);
  const custom = useViewConfigStore((s) => s.filters.custom);
  const setFilters = useViewConfigStore((s) => s.setFilters);
  const sort = useViewConfigStore((s) => s.sort);
  const setSort = useViewConfigStore((s) => s.setSort);
  if (!fields?.length) return null;

  const byId = new Map(fields.map((f) => [f.id, f]));
  const rows = (custom ?? []).filter((f) => byId.has(f.fieldId));
  const activeCount = rows.filter(filterIsComplete).length;
  const sortField = sort ? byId.get(sort.fieldId) : undefined;

  const setRows = (next: CustomFilter[]) => setFilters({ custom: next });
  const patch = (i: number, change: Partial<CustomFilter>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...change } : r)));
  const firstOp = (field: CustomField) => FILTER_OPS[field.type][0]!.op;

  return (
    <>
      <Popover>
        <PopoverTrigger
          className={cn(
            "inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800",
            activeCount > 0 && "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-950 dark:text-violet-300",
          )}
        >
          Fields
          {activeCount > 0 && <span className="tabular-nums">· {activeCount}</span>}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(30rem,calc(100vw-2rem))] p-3">
          <p className="mb-2 text-xs font-semibold text-neutral-500">Filter by custom fields</p>
          <div className="flex flex-col gap-2">
            {rows.length === 0 && <p className="text-xs text-neutral-500">No field filters yet.</p>}
            {rows.map((row, i) => {
              const field = byId.get(row.fieldId)!;
              return (
                <div key={i} className="flex flex-wrap items-start gap-1.5 rounded-md bg-neutral-50 p-1.5 dark:bg-neutral-800/50">
                  <select
                    aria-label="field"
                    value={row.fieldId}
                    onChange={(e) => {
                      const next = byId.get(e.target.value)!;
                      patch(i, { fieldId: next.id, op: firstOp(next), value: undefined });
                    }}
                    className={cn(select, "max-w-36")}
                  >
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="condition"
                    value={row.op}
                    onChange={(e) => patch(i, { op: e.target.value as CustomFilter["op"] })}
                    className={select}
                  >
                    {FILTER_OPS[field.type].map((o) => (
                      <option key={o.op} value={o.op}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="min-w-32 flex-1">
                    <FilterValue field={field} filter={row} listId={listId} onChange={(value) => patch(i, { value })} />
                  </div>
                  <button
                    type="button"
                    aria-label="remove filter"
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                    className="cursor-pointer rounded p-1 text-neutral-400 hover:text-red-600"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setRows([...rows, { fieldId: fields[0]!.id, op: firstOp(fields[0]!) }])}
              className="flex w-fit cursor-pointer items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
            >
              <Plus className="size-3" /> Add filter
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5 border-t pt-3 dark:border-neutral-800">
            <span className="text-xs font-semibold text-neutral-500">Sort by</span>
            <select
              aria-label="sort by field"
              value={sortField?.id ?? ""}
              onChange={(e) => setSort(e.target.value ? { fieldId: e.target.value, dir: sort?.dir ?? "asc" } : null)}
              className={cn(select, "max-w-44")}
            >
              <option value="">None</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {sortField && sort && (
              <button
                type="button"
                onClick={() => setSort({ ...sort, dir: sort.dir === "asc" ? "desc" : "asc" })}
                className="flex h-7 cursor-pointer items-center gap-1 rounded-md border border-neutral-200 px-2 text-xs dark:border-neutral-700"
              >
                {sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                {sort.dir === "asc" ? "Ascending" : "Descending"}
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {sortField && sort && (
        <span className="inline-flex h-7 items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-2 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <FieldTypeIcon type={sortField.type} className="size-3" />
          {sortField.name}
          {sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          <button type="button" aria-label="clear field sort" onClick={() => setSort(null)} className="cursor-pointer opacity-60 hover:opacity-100">
            <X className="size-3" />
          </button>
        </span>
      )}
    </>
  );
}
