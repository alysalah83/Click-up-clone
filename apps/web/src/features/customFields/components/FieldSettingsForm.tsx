"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { computeFormula, FORMULA_REFERENCE_TYPES, validateFormula } from "@clickup/shared/formula";
import { cn } from "@/shared/lib/utils/cn";
import type { Task } from "@/features/task/types";
import { CUSTOM_FIELD_TYPES, type CustomField, type CustomFieldDraft, type CustomFieldType } from "../types";
import { FIELD_TYPE_HINT, FIELD_TYPE_LABEL, formatNumber, OPTION_COLORS } from "../lib";
import FieldTypeIcon from "./FieldTypeIcon";

type DraftOption = { id?: string; key: string; name: string; color: string };

let optionKey = 0;
const newKey = () => `opt-${++optionKey}`;

/**
 * Name, type and type settings of a custom field: dropdown options with colors, or a formula with
 * a live check and preview. `field` set = editing (the type is fixed).
 */
function FieldSettingsForm({
  field,
  fields,
  sampleTask,
  pending,
  onSubmit,
  onCancel,
}: {
  field?: CustomField;
  /** The list's fields (formula references, name clashes). */
  fields: CustomField[];
  /** A task to preview a formula on. */
  sampleTask?: Pick<Task, "name" | "points" | "customFields">;
  pending?: boolean;
  onSubmit: (draft: CustomFieldDraft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(field?.name ?? "");
  const [type, setType] = useState<CustomFieldType>(field?.type ?? "dropdown");
  const [options, setOptions] = useState<DraftOption[]>(
    field?.config.options?.map((o) => ({ ...o, key: o.id })) ?? [
      { key: newKey(), name: "", color: OPTION_COLORS[0]! },
    ],
  );
  const [expression, setExpression] = useState(field?.config.expression ?? "");

  const others = fields.filter((f) => f.id !== field?.id);
  const references = others.filter((f) => FORMULA_REFERENCE_TYPES.includes(f.type));
  const nameTaken = others.some((f) => f.name.trim().toLowerCase() === name.trim().toLowerCase());
  const formulaError = type === "formula" ? validateFormula(expression, others) : null;
  const preview =
    type === "formula" && !formulaError && sampleTask ? computeFormula({ config: { expression } }, sampleTask, others) : null;
  const cleanOptions = options.filter((o) => o.name.trim());
  const canSave = !!name.trim() && !nameTaken && !formulaError && !pending;

  const submit = () => {
    if (!canSave) return;
    onSubmit({
      name: name.trim(),
      type,
      config:
        type === "dropdown"
          ? { options: cleanOptions.map(({ id, name, color }) => ({ ...(id && { id }), name: name.trim(), color })) }
          : type === "formula"
            ? { expression: expression.trim() }
            : {},
    });
  };

  const updateOption = (key: string, patch: Partial<DraftOption>) =>
    setOptions((list) => list.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  const nextColor = (color: string) => OPTION_COLORS[(OPTION_COLORS.indexOf(color) + 1) % OPTION_COLORS.length]!;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {!field && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-neutral-500">Field type</p>
          <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="Field type">
            {CUSTOM_FIELD_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                title={FIELD_TYPE_HINT[t]}
                onClick={() => setType(t)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition",
                  type === t
                    ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-950 dark:text-violet-300"
                    : "border-neutral-200 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800",
                )}
              >
                <FieldTypeIcon type={t} />
                {FIELD_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
        Field name
        <input
          autoFocus
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === "formula" ? "e.g. Effort score" : type === "dropdown" ? "e.g. Severity" : "Name"}
          className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-violet-400 dark:border-neutral-700 dark:text-neutral-100"
        />
        {nameTaken && <span className="text-red-600">A field with this name already exists</span>}
      </label>

      {type === "dropdown" && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-neutral-500">Options</p>
          {options.map((o) => (
            <div key={o.key} className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="change option color"
                title="Change color"
                onClick={() => updateOption(o.key, { color: nextColor(o.color) })}
                style={{ backgroundColor: o.color }}
                className="size-5 shrink-0 cursor-pointer rounded"
              />
              <input
                value={o.name}
                maxLength={40}
                aria-label="option name"
                placeholder="Option name"
                onChange={(e) => updateOption(o.key, { name: e.target.value })}
                className="min-w-0 flex-1 rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-violet-400 dark:border-neutral-700"
              />
              <button
                type="button"
                aria-label="remove option"
                onClick={() => setOptions((list) => list.filter((x) => x.key !== o.key))}
                className="cursor-pointer rounded p-0.5 text-neutral-400 hover:text-red-600"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={options.length >= 30}
            onClick={() =>
              setOptions((list) => [
                ...list,
                { key: newKey(), name: "", color: OPTION_COLORS[list.length % OPTION_COLORS.length]! },
              ])
            }
            className="flex w-fit cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs text-violet-600 hover:underline disabled:opacity-50"
          >
            <Plus className="size-3" /> Add option
          </button>
          {field && <p className="text-[11px] text-neutral-400">Removing an option clears it from the tasks that use it.</p>}
        </div>
      )}

      {type === "formula" && (
        <div className="flex flex-col gap-1.5">
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Formula
            <input
              value={expression}
              maxLength={500}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="points * 2 + {Estimate (h)}"
              spellCheck={false}
              className={cn(
                "rounded-md border bg-transparent px-2 py-1.5 font-mono text-sm text-neutral-900 outline-none dark:text-neutral-100",
                expression && formulaError ? "border-red-400" : "border-neutral-300 focus:border-violet-400 dark:border-neutral-700",
              )}
            />
          </label>
          <p className="text-[11px] leading-snug text-neutral-500">
            Use numbers, <code>+ - * /</code> and parentheses. Reference <code>points</code> (sprint points) and number or
            progress fields by name in braces, like <code>{"{Estimate (h)} * 2"}</code>. Empty values leave the result empty.
          </p>
          <div className="flex flex-wrap gap-1">
            {["points", ...references.map((f) => `{${f.name}}`)].map((ref) => (
              <button
                key={ref}
                type="button"
                onClick={() => setExpression((e) => `${e}${e && !e.endsWith(" ") ? " " : ""}${ref}`)}
                className="cursor-pointer rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-700 hover:bg-violet-100 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {ref}
              </button>
            ))}
          </div>
          {expression && formulaError && <p className="text-xs text-red-600">{formulaError}</p>}
          {preview && sampleTask && (
            <p className="truncate text-xs text-neutral-500">
              Preview on “{sampleTask.name}”:{" "}
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {preview.ok ? (preview.value === null ? "empty" : formatNumber(preview.value)) : `— (${preview.error})`}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t pt-2 dark:border-neutral-800">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="cursor-pointer rounded bg-violet-600 px-3 py-1 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {field ? "Save" : "Add field"}
        </button>
      </div>
    </form>
  );
}

export default FieldSettingsForm;
