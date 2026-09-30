"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HiSparkles } from "react-icons/hi2";
import { createSubtaskAction } from "@/features/taskDetail/actions/taskDetail.actions";
import Checkbox from "@/shared/ui/CheckBox";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { suggestSubtasksAction, summarizeTaskAction } from "../actions/ai.actions";

const AI_BTN =
  "flex cursor-pointer items-center gap-1.5 rounded-md border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:cursor-wait disabled:opacity-60 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20";

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="dismiss"
      onClick={onClick}
      className="cursor-pointer rounded p-1 text-neutral-500 hover:bg-violet-100 dark:hover:bg-violet-500/20"
    >
      <ICONS_MAP.close className="size-4" />
    </button>
  );
}

/** "Summarize" and "Generate subtasks" buttons with their result cards. */
function AiActions({
  taskId,
  listId,
  canHaveSubtasks,
}: {
  taskId: string;
  listId: string;
  canHaveSubtasks: boolean;
}) {
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [isSummarizing, startSummarize] = useTransition();
  const [isSuggesting, startSuggest] = useTransition();
  const [isAdding, startAdd] = useTransition();

  const summarize = () =>
    startSummarize(async () => {
      setMessage(null);
      const result = await summarizeTaskAction(taskId);
      if (result.ok) setSummary(result.data);
      else setMessage(result.message);
    });

  const suggest = () =>
    startSuggest(async () => {
      setMessage(null);
      const result = await suggestSubtasksAction(taskId);
      if (!result.ok) return setMessage(result.message);
      setSuggestions(result.data);
      setSelected(new Set(result.data.map((_, i) => i)));
    });

  const addSelected = () =>
    startAdd(async () => {
      const names = (suggestions ?? []).filter((_, i) => selected.has(i));
      const results = await Promise.all(names.map((name) => createSubtaskAction(taskId, name, listId)));
      const failed = results.filter((r) => r.status === "error").length;
      queryClient.invalidateQueries({ queryKey: ["task"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
      if (failed) setMessage(`${failed} subtask(s) could not be added.`);
      else setSuggestions(null);
    });

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={AI_BTN} onClick={summarize} disabled={isSummarizing}>
          <HiSparkles className="size-3.5" />
          {isSummarizing ? "Summarizing…" : "Summarize"}
        </button>
        {canHaveSubtasks && (
          <button type="button" className={AI_BTN} onClick={suggest} disabled={isSuggesting}>
            <HiSparkles className="size-3.5" />
            {isSuggesting ? "Thinking…" : "Generate subtasks"}
          </button>
        )}
      </div>

      {message && (
        <p role="alert" className="text-xs text-violet-700 dark:text-violet-300">
          {message}
        </p>
      )}

      {summary && (
        <div className="rounded-lg border border-violet-300 bg-violet-50 p-3 dark:border-violet-500/40 dark:bg-violet-500/10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
            <HiSparkles className="size-3.5" />
            <span className="flex-1">AI summary</span>
            <DismissButton onClick={() => setSummary(null)} />
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{summary}</p>
        </div>
      )}

      {suggestions && (
        <div className="rounded-lg border border-violet-300 bg-violet-50 p-3 dark:border-violet-500/40 dark:bg-violet-500/10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
            <HiSparkles className="size-3.5" />
            <span className="flex-1">Suggested subtasks</span>
            <DismissButton onClick={() => setSuggestions(null)} />
          </div>
          {suggestions.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-500">No suggestions.</p>
          ) : (
            <>
              <ul className="mt-2 flex flex-col gap-1.5">
                {suggestions.map((name, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} />
                    <span className="min-w-0 flex-1">{name}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addSelected}
                disabled={selected.size === 0 || isAdding}
                className="mt-3 cursor-pointer rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdding ? "Adding…" : "Add selected"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AiActions;
