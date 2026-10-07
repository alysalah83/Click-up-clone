"use client";

import { useState } from "react";
import { format } from "date-fns";
import { TriangleAlert } from "lucide-react";
import {
  CSV_FIELDS,
  CSV_FIELD_LABELS,
  summarizeImport,
  type CsvField,
  type ImportModel,
} from "@clickup/shared/importParse";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { cn } from "@/shared/lib/utils/cn";
import { setColumnField, type ParsedFile } from "../lib";

const PRIORITY_CLASS: Record<string, string> = {
  urgent: "text-red-600 dark:text-red-400",
  high: "text-amber-600 dark:text-amber-400",
  normal: "text-sky-600 dark:text-sky-400",
  low: "text-neutral-500",
};

const statusHex = (color: string) => COLORS_TOKENS[color as keyof typeof COLORS_TOKENS]?.hex ?? "#737373";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

interface MapStepProps {
  parsed: ParsedFile;
  model: ImportModel;
  listName: string;
  onListName: (name: string) => void;
  workspaceId: string;
  onWorkspace: (id: string) => void;
  spaces: { id: string; name: string }[];
  mapping: CsvField[];
  onMapping: (mapping: CsvField[]) => void;
  closedCards: "skip" | "done";
  onClosedCards: (value: "skip" | "done") => void;
  /** Lowercased names and emails of the target space's members. */
  memberKeys: Set<string>;
}

/** Step 2: list name and space, CSV column mapping (or Trello options), summary, warnings, preview. */
function MapStep(props: MapStepProps) {
  const { parsed, model, listName, onListName, workspaceId, onWorkspace, spaces, memberKeys } = props;
  const summary = summarizeImport(model);
  const matched = model.tasks.filter((t) => t.assignees.some((a) => memberKeys.has(a.toLowerCase()))).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-500">List name</span>
          <Input value={listName} onChange={(e) => onListName(e.target.value)} maxLength={100} aria-label="List name" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-500">Space</span>
          <Select value={workspaceId} onValueChange={onWorkspace}>
            <SelectTrigger className="w-full" aria-label="Space">
              <SelectValue placeholder="Choose a space" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      {parsed.kind === "csv" ? (
        <CsvMapping rows={parsed.rows} mapping={props.mapping} onMapping={props.onMapping} />
      ) : (
        <TrelloOptions closedCards={props.closedCards} onClosedCards={props.onClosedCards} />
      )}

      <section aria-label="Import summary" className="flex flex-col gap-2">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {plural(summary.tasks, "task")} · {summary.statuses} {summary.statuses === 1 ? "status" : "statuses"} ·{" "}
          {summary.withDueDates} with due dates · {plural(summary.tags, "tag")}
          {summary.checklists > 0 && ` · ${plural(summary.checklists, "checklist")}`}
          {summary.assigned > 0 && ` · ${matched} of ${summary.assigned} assigned tasks match space members`}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {model.statuses.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold uppercase text-white"
              style={{ backgroundColor: statusHex(s.color) }}
            >
              {s.name}
            </span>
          ))}
        </div>
      </section>

      <Warnings warnings={model.warnings} />
      <Preview model={model} memberKeys={memberKeys} />
    </div>
  );
}

function CsvMapping({
  rows,
  mapping,
  onMapping,
}: {
  rows: string[][];
  mapping: CsvField[];
  onMapping: (mapping: CsvField[]) => void;
}) {
  const headers = rows[0] ?? [];
  const sample = (i: number) => rows.slice(1).find((r) => (r[i] ?? "").trim())?.[i]?.trim() ?? "";
  return (
    <section aria-label="Column mapping" className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Map columns</h3>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-100 text-xs text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Column</th>
              <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Example</th>
              <th className="px-3 py-2 text-left font-medium">Import as</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((header, i) => (
              <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-3 py-1.5 font-medium text-neutral-800 dark:text-neutral-200">{header || `Column ${i + 1}`}</td>
                <td className="hidden max-w-48 truncate px-3 py-1.5 text-neutral-500 sm:table-cell">{sample(i)}</td>
                <td className="px-3 py-1.5">
                  <Select value={mapping[i] ?? "ignore"} onValueChange={(v) => onMapping(setColumnField(mapping, i, v as CsvField))}>
                    <SelectTrigger size="sm" className={cn("w-40", mapping[i] === "ignore" && "text-neutral-400")} aria-label={`Import ${header} as`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CSV_FIELDS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {CSV_FIELD_LABELS[f]}
                          {f === "name" && " (required)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500">
        Assignees are matched to space members by name or email; others are left unassigned. Tags and assignees can hold
        several values separated by commas.
      </p>
    </section>
  );
}

function TrelloOptions({
  closedCards,
  onClosedCards,
}: {
  closedCards: "skip" | "done";
  onClosedCards: (value: "skip" | "done") => void;
}) {
  return (
    <section aria-label="Trello options" className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
      <p className="text-neutral-700 dark:text-neutral-300">
        Trello lists become statuses (in board order, the last one is the done status), cards become tasks with their
        description, dates, labels as tags and checklists. Archived lists are skipped.
      </p>
      <fieldset className="flex flex-wrap items-center gap-4">
        <legend className="sr-only">Archived cards</legend>
        <span className="font-medium text-neutral-800 dark:text-neutral-200">Archived cards:</span>
        {(
          [
            ["skip", "Skip"],
            ["done", "Import as done"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="closed-cards"
              checked={closedCards === value}
              onChange={() => onClosedCards(value)}
              className="accent-violet-600"
            />
            {label}
          </label>
        ))}
      </fieldset>
    </section>
  );
}

function Warnings({ warnings }: { warnings: ImportModel["warnings"] }) {
  const [all, setAll] = useState(false);
  if (warnings.length === 0) return null;
  const shown = all ? warnings : warnings.slice(0, 4);
  return (
    <section aria-label="Warnings" className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
      <p className="mb-1 flex items-center gap-1.5 font-medium">
        <TriangleAlert className="size-4" /> {plural(warnings.length, "warning")}
      </p>
      <ul className="flex flex-col gap-0.5 text-xs">
        {shown.map((w, i) => (
          <li key={i}>
            {w.where && <span className="font-medium">{w.where}: </span>}
            {w.message}
          </li>
        ))}
      </ul>
      {warnings.length > shown.length && (
        <button type="button" onClick={() => setAll(true)} className="mt-1 text-xs font-medium underline">
          Show {warnings.length - shown.length} more
        </button>
      )}
    </section>
  );
}

function Preview({ model, memberKeys }: { model: ImportModel; memberKeys: Set<string> }) {
  const statusColor = new Map(model.statuses.map((s) => [s.name, statusHex(s.color)]));
  const tagColor = new Map(model.tags.map((t) => [t.name, t.color]));
  const rows = model.tasks.slice(0, 10);
  if (rows.length === 0)
    return <p className="rounded-xl border border-dashed p-4 text-center text-sm text-neutral-500">No tasks to import yet.</p>;

  return (
    <section aria-label="Preview" className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Preview <span className="font-normal text-neutral-500">(first {rows.length} of {model.tasks.length})</span>
      </h3>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-100 text-xs text-neutral-500 dark:bg-neutral-900">
            <tr>
              {["Name", "Status", "Priority", "Due date", "Assignees", "Tags"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((task, i) => (
              <tr key={i} className="border-t border-neutral-200 align-top dark:border-neutral-800">
                <td className="max-w-56 px-3 py-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                  <span className="line-clamp-2">{task.name}</span>
                  {task.checklists.length > 0 && (
                    <span className="text-xs font-normal text-neutral-500">
                      {plural(task.checklists.reduce((n, c) => n + c.items.length, 0), "checklist item")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium uppercase">
                    <span className="size-2 rounded-full" style={{ backgroundColor: statusColor.get(task.status) }} />
                    {task.status}
                  </span>
                </td>
                <td className={cn("px-3 py-1.5 text-xs capitalize", PRIORITY_CLASS[task.priority])}>
                  {task.priority === "none" ? "–" : task.priority}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "–"}
                </td>
                <td className="px-3 py-1.5 text-xs">
                  {task.assignees.length === 0
                    ? "–"
                    : task.assignees.map((a) => {
                        const known = memberKeys.has(a.toLowerCase());
                        return (
                          <span
                            key={a}
                            title={known ? undefined : "Not a member of this space: left unassigned"}
                            className={cn("block whitespace-nowrap", known ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-400 line-through")}
                          >
                            {a}
                          </span>
                        );
                      })}
                </td>
                <td className="px-3 py-1.5">
                  <span className="flex flex-wrap gap-1">
                    {task.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${tagColor.get(t)}26`, color: tagColor.get(t) }}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MapStep;
