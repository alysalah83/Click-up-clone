"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FIELD_TYPE_LABELS, FIELD_TYPES, MAX_FORM_FIELDS, TARGET_LABELS, isFieldRequired, targetsFor } from "../lib";
import type { FormField, FormFieldTarget, FormFieldType } from "../types";

const iconButton =
  "grid size-7 shrink-0 place-items-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
const smallLabel = "text-[11px] font-medium tracking-wide text-neutral-500 uppercase";

/** One field of the builder: label, type, mapping, placeholder, required, dropdown options, order. */
function FieldEditor({
  field,
  index,
  count,
  problem,
  onChange,
  onType,
  onMap,
  onMove,
  onRemove,
}: {
  field: FormField;
  index: number;
  count: number;
  problem?: string;
  onChange: (patch: Partial<FormField>) => void;
  onType: (type: FormFieldType) => void;
  onMap: (target: FormFieldTarget) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const isName = field.mapTo === "name";
  const setOption = (i: number, value: string) => onChange({ options: field.options.map((o, j) => (j === i ? value : o)) });

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-xs dark:bg-neutral-900 ${
        problem ? "border-red-300 dark:border-red-500/50" : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-5 shrink-0 text-center text-xs font-semibold text-neutral-400 tabular-nums">{index + 1}</span>
        <Input
          aria-label="Field label"
          value={field.label}
          maxLength={100}
          placeholder="Question"
          onChange={(e) => onChange({ label: e.target.value })}
          className="h-8 font-medium"
        />
        <button type="button" className={iconButton} aria-label="Move field up" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp className="size-4" />
        </button>
        <button type="button" className={iconButton} aria-label="Move field down" disabled={index === count - 1} onClick={() => onMove(1)}>
          <ArrowDown className="size-4" />
        </button>
        <button
          type="button"
          className={`${iconButton} hover:text-red-600`}
          aria-label="Delete field"
          title={isName ? "Map another field to the task name first" : "Delete field"}
          disabled={isName}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid gap-2 pl-6 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={smallLabel}>Type</span>
          <Select value={field.type} onValueChange={(v) => onType(v as FormFieldType)}>
            <SelectTrigger size="sm" className="w-full" aria-label="Field type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t} value={t} disabled={isName && !targetsFor(t).includes("name")}>
                  {FIELD_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={smallLabel}>Maps to</span>
          <Select value={field.mapTo} onValueChange={(v) => onMap(v as FormFieldTarget)}>
            <SelectTrigger size="sm" className="w-full" aria-label="Task property">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {targetsFor(field.type).map((t) => (
                <SelectItem key={t} value={t} disabled={isName && t !== "name"}>
                  {TARGET_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {field.type !== "priority" && (
          <label className="flex flex-col gap-1">
            <span className={smallLabel}>{field.type === "checkbox" ? "Checkbox text" : "Placeholder"}</span>
            <Input
              value={field.placeholder}
              maxLength={200}
              placeholder={field.type === "checkbox" ? "Yes" : "Shown inside the empty input"}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className="h-8"
            />
          </label>
        )}
        <label className="flex items-center gap-2 self-end pb-1.5 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            className="size-4 accent-violet-600"
            checked={isFieldRequired(field)}
            disabled={isName}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          Required{isName && <span className="text-xs text-neutral-400">(task name)</span>}
        </label>
      </div>

      {field.type === "dropdown" && (
        <div className="flex flex-col gap-1.5 pl-6">
          <span className={smallLabel}>Options</span>
          {field.options.map((option, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full bg-violet-400" />
              <Input
                aria-label={`Option ${i + 1}`}
                value={option}
                maxLength={100}
                onChange={(e) => setOption(i, e.target.value)}
                className="h-7 text-sm"
              />
              <button
                type="button"
                className={iconButton}
                aria-label={`Remove option ${i + 1}`}
                disabled={field.options.length <= 1}
                onClick={() => onChange({ options: field.options.filter((_, j) => j !== i) })}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={field.options.length >= MAX_FORM_FIELDS}
            onClick={() => onChange({ options: [...field.options, `Option ${field.options.length + 1}`] })}
            className="flex items-center gap-1 self-start rounded-md px-1.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            <Plus className="size-3.5" /> Add option
          </button>
        </div>
      )}

      {problem && <p className="pl-6 text-xs text-red-600 dark:text-red-400">{problem}</p>}
    </li>
  );
}

export default FieldEditor;
