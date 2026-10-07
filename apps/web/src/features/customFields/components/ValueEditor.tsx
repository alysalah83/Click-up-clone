"use client";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useState, type ReactNode } from "react";
import { Calendar } from "react-date-range";
import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CheckBox from "@/shared/ui/CheckBox";
import { cn } from "@/shared/lib/utils/cn";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { useListMembers } from "@/features/members/hooks/useMembers";
import { AvatarStack, UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import type { Assignee } from "@/features/members/types";
import type { Task } from "@/features/task/types";
import { useSetCustomFieldValue } from "../hooks";
import { formatDay, formatNumber, fromIsoDay, resolveValue, toIsoDay } from "../lib";
import type { CustomField, CustomFieldValue, DropdownOption } from "../types";

export type EditorVariant = "cell" | "panel";

interface EditorProps {
  field: CustomField;
  value: CustomFieldValue | null;
  onChange: (value: CustomFieldValue | null) => void;
  variant: EditorVariant;
  listId: string;
}

const triggerClass = (variant: EditorVariant) =>
  variant === "cell"
    ? "flex h-full w-full min-w-0 cursor-pointer items-center px-2 text-left"
    : "flex min-h-7 min-w-0 cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-left text-sm text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700";

const Empty = ({ variant }: { variant: EditorVariant }) => (
  <span className="text-neutral-400">{variant === "panel" ? "Empty" : "–"}</span>
);

/** A solid colored option pill, as on ClickUp dropdown fields. */
export function OptionPill({ option, className }: { option: Pick<DropdownOption, "name" | "color">; className?: string }) {
  return (
    <span
      style={{ backgroundColor: option.color }}
      className={cn(
        "inline-flex max-w-full items-center truncate rounded px-1.5 py-0.5 text-xs font-semibold text-white",
        className,
      )}
    >
      <span className="truncate">{option.name}</span>
    </span>
  );
}

function DropdownEditor({ field, value, onChange, variant }: EditorProps) {
  const [open, setOpen] = useState(false);
  const options = field.config.options ?? [];
  const current = options.find((o) => o.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerClass(variant)} aria-label={`${field.name}: ${current?.name ?? "empty"}`}>
        {current ? <OptionPill option={current} /> : <Empty variant={variant} />}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        {options.length === 0 && <p className="p-2 text-xs text-neutral-500">No options yet. Edit the field to add some.</p>}
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              onChange(o.id === value ? null : o.id);
              setOpen(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <OptionPill option={o} />
            {o.id === value && <Check className="ml-auto size-3.5 text-violet-500" />}
          </button>
        ))}
        {current && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="mt-1 w-full cursor-pointer rounded border-t px-2 py-1.5 text-left text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Text and number: click to edit in place, Enter or blur saves, Escape cancels. */
function InlineInputEditor({ field, value, onChange, variant }: EditorProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const isNumber = field.type === "number";
  const shown = value === null ? null : isNumber ? formatNumber(Number(value)) : String(value);

  const commit = () => {
    if (draft === null) return;
    const text = draft.trim();
    setDraft(null);
    if (!isNumber) return text !== (value ?? "") && onChange(text || null);
    if (text === "") return value !== null && onChange(null);
    const n = Number(text);
    if (Number.isFinite(n) && n !== value) onChange(n);
  };

  if (draft !== null)
    return (
      <input
        autoFocus
        aria-label={field.name}
        type={isNumber ? "number" : "text"}
        step="any"
        maxLength={2000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.stopPropagation();
            setDraft(null);
          }
        }}
        className={cn(
          "w-full min-w-0 rounded border border-violet-400 bg-white px-2 py-1 text-sm outline-none dark:bg-neutral-900",
          isNumber && "tabular-nums",
          variant === "cell" && "h-full",
        )}
      />
    );
  return (
    <button
      type="button"
      aria-label={`edit ${field.name}`}
      onClick={() => setDraft(value === null ? "" : String(value))}
      className={cn(triggerClass(variant), isNumber && "tabular-nums", isNumber && variant === "cell" && "justify-end")}
    >
      {shown === null ? <Empty variant={variant} /> : <span className="truncate">{shown}</span>}
    </button>
  );
}

function DateEditor({ field, value, onChange, variant }: EditorProps) {
  const [open, setOpen] = useState(false);
  const iso = typeof value === "string" ? value : null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerClass(variant)} aria-label={`${field.name}: ${iso ?? "empty"}`}>
        {iso ? <span className="truncate tabular-nums">{formatDay(iso)}</span> : <Empty variant={variant} />}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden p-0">
        <Calendar
          date={iso ? fromIsoDay(iso) : new Date()}
          color="#7b68ee"
          onChange={(date: Date) => {
            onChange(toIsoDay(date));
            setOpen(false);
          }}
        />
        {iso && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full cursor-pointer border-t px-3 py-2 text-left text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Clear date
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function CheckboxEditor({ value, onChange, variant }: EditorProps) {
  return (
    <div className={cn(variant === "cell" ? "flex h-full w-full items-center justify-center" : "flex items-center px-2 py-1")}>
      <CheckBox checked={value === true} onCheckedChange={() => onChange(value === true ? null : true)} />
    </div>
  );
}

function PeopleEditor({ field, value, onChange, variant, listId }: EditorProps) {
  const { members, isPending } = useListMembers(listId);
  const [search, setSearch] = useState("");
  const ids = Array.isArray(value) ? value : [];
  const people: Assignee[] = (members ?? []).map((m) => ({ id: m.userId, name: m.name, email: m.email, avatarColor: m.avatarColor }));
  const selected = ids.map((id) => people.find((p) => p.id === id)).filter((p): p is Assignee => !!p);
  const query = search.trim().toLowerCase();
  const filtered = people.filter((p) => `${displayName(p)} ${p.email ?? ""}`.toLowerCase().includes(query));
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    onChange(next.length ? next : null);
  };

  return (
    <Popover>
      <PopoverTrigger className={triggerClass(variant)} aria-label={`${field.name}: ${selected.length} people`}>
        {selected.length ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <AvatarStack users={selected} size="xs" max={3} />
            {variant === "panel" && <span className="truncate">{selected.map(displayName).join(", ")}</span>}
          </span>
        ) : (
          <Empty variant={variant} />
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="mb-1 flex items-center gap-2 rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-600">
          <ICONS_MAP.search className="size-4 text-neutral-500" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            aria-label="search people"
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
          />
        </div>
        <ul className="flex max-h-64 flex-col overflow-y-auto">
          {isPending && <li className="px-2 py-1.5 text-sm text-neutral-500">Loading…</li>}
          {!isPending && filtered.length === 0 && <li className="px-2 py-1.5 text-sm text-neutral-500">No members found</li>}
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={ids.includes(p.id)}
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  ids.includes(p.id) && "bg-violet-500/10",
                )}
              >
                <UserAvatar user={p} size="sm" />
                <span className="flex-1 truncate">{displayName(p)}</span>
                {ids.includes(p.id) && <Check className="size-4 text-violet-500" />}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** A thin bar with the percentage, as on ClickUp's manual progress field. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex w-full min-w-0 items-center gap-2", className)}>
      <span className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <span
          className={cn("block h-full rounded-full", value >= 100 ? "bg-emerald-500" : "bg-violet-500")}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-neutral-500">{value}%</span>
    </span>
  );
}

function ProgressEditor({ field, value, onChange, variant }: EditorProps) {
  const current = typeof value === "number" ? value : null;
  const [draft, setDraft] = useState(current ?? 0);
  const commit = (next: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(next)));
    if (clamped !== current) onChange(clamped);
  };
  return (
    <Popover onOpenChange={(open) => open && setDraft(current ?? 0)}>
      <PopoverTrigger className={triggerClass(variant)} aria-label={`${field.name}: ${current ?? "empty"}`}>
        {current === null ? <Empty variant={variant} /> : <ProgressBar value={current} />}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <p className="mb-2 text-xs font-medium text-neutral-500">{field.name}</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={draft}
            aria-label={`${field.name} slider`}
            onChange={(e) => setDraft(Number(e.target.value))}
            onPointerUp={() => commit(draft)}
            onKeyUp={() => commit(draft)}
            className="flex-1 accent-violet-600"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={draft}
            aria-label={`${field.name} percent`}
            onChange={(e) => setDraft(Number(e.target.value))}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => e.key === "Enter" && commit(draft)}
            className="w-14 rounded border px-1 py-0.5 text-right text-sm tabular-nums dark:bg-transparent"
          />
        </div>
        {current !== null && (
          <button type="button" onClick={() => onChange(null)} className="mt-2 cursor-pointer text-xs text-neutral-500 hover:underline">
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function FormulaValue({ value, error, variant }: { value: CustomFieldValue | null; error?: string; variant: EditorVariant }) {
  const content: ReactNode = error ? (
    <span className="text-neutral-400" title={`Formula error: ${error}`}>
      —
    </span>
  ) : value === null ? (
    <Empty variant={variant} />
  ) : (
    <span className="truncate font-semibold tabular-nums">{formatNumber(Number(value))}</span>
  );
  return (
    <div
      title={error ? `Formula error: ${error}` : "Computed by a formula"}
      className={cn(
        variant === "cell" ? "flex h-full w-full items-center justify-end px-2" : "flex min-h-7 items-center px-2 py-1 text-sm",
        "cursor-default",
      )}
    >
      {content}
    </div>
  );
}

/** The right editor for a field type, bound to one task. */
function ValueEditor({
  field,
  fields,
  task,
  listId,
  variant,
}: {
  field: CustomField;
  fields: CustomField[];
  task: Pick<Task, "id" | "points" | "customFields">;
  listId: string;
  variant: EditorVariant;
}) {
  const { mutate } = useSetCustomFieldValue(listId);
  const { value, error } = resolveValue(field, task, fields);
  if (field.type === "formula") return <FormulaValue value={value} error={error} variant={variant} />;

  const props: EditorProps = {
    field,
    value,
    variant,
    listId,
    onChange: (next) => mutate({ taskId: task.id, fieldId: field.id, value: next }),
  };
  switch (field.type) {
    case "dropdown":
      return <DropdownEditor {...props} />;
    case "text":
    case "number":
      return <InlineInputEditor {...props} />;
    case "date":
      return <DateEditor {...props} />;
    case "checkbox":
      return <CheckboxEditor {...props} />;
    case "people":
      return <PeopleEditor {...props} />;
    case "progress":
      return <ProgressEditor {...props} />;
  }
}

export default ValueEditor;
