"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutTemplate, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils/cn";
import { useApplyTemplate, useTaskTemplates } from "../hooks";
import { filterTemplates, summaryParts } from "../lib";
import { useTemplatePicker } from "../store";
import type { TaskTemplate, TemplateTarget } from "../types";
import TemplatePreview from "./TemplatePreview";

function PickerBody({ target, onDone }: { target: TemplateTarget; onDone: () => void }) {
  const { data: templates, isPending, error } = useTaskTemplates();
  const apply = useApplyTemplate();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  const visible = filterTemplates(templates ?? [], query);
  const selected: TaskTemplate | undefined = visible.find((t) => t.id === selectedId) ?? visible[0];
  const taskName = selected ? (names[selected.id] ?? selected.snapshot.name) : "";

  const use = () => {
    if (!selected || !taskName.trim() || apply.isPending) return;
    apply.mutate(
      { templateId: selected.id, target, name: taskName.trim().slice(0, 128) },
      { onSuccess: onDone },
    );
  };

  return (
    <div className="flex h-[min(70vh,560px)] flex-col sm:flex-row">
      <aside className="flex max-h-56 shrink-0 flex-col border-b border-neutral-200 sm:max-h-none sm:w-72 sm:border-r sm:border-b-0 dark:border-neutral-800">
        <div className="relative p-3">
          <Search aria-hidden className="absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
            className="pl-8"
          />
        </div>
        <ul className="flex-1 overflow-y-auto px-2 pb-2" role="listbox" aria-label="Templates">
          {isPending &&
            Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="p-2">
                <Skeleton className="h-9 w-full" />
              </li>
            ))}
          {error && <li className="p-3 text-sm text-destructive">Could not load templates.</li>}
          {templates && visible.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">
              {templates.length === 0
                ? "No templates yet. Open a task, click ⋯ and choose Save as template."
                : "No templates match your search."}
            </li>
          )}
          {visible.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="option"
                aria-selected={t.id === selected?.id}
                onClick={() => setSelectedId(t.id)}
                onDoubleClick={() => {
                  setSelectedId(t.id);
                  use();
                }}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  t.id === selected?.id && "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
                )}
              >
                <LayoutTemplate aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{t.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[t.workspace.name, ...summaryParts(t)].join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link
          href="/home/templates"
          onClick={onDone}
          className="border-t border-neutral-200 px-4 py-2.5 text-xs text-muted-foreground hover:text-violet-600 dark:border-neutral-800"
        >
          Manage templates
        </Link>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          {selected ? (
            <TemplatePreview template={selected} />
          ) : (
            <p className="text-sm text-muted-foreground">Select a template to preview it.</p>
          )}
        </div>
        {selected && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              use();
            }}
            className="flex flex-col gap-2 border-t border-neutral-200 p-4 sm:flex-row sm:items-center dark:border-neutral-800"
          >
            <Input
              value={taskName}
              onChange={(e) => setNames((cur) => ({ ...cur, [selected.id]: e.target.value }))}
              maxLength={128}
              aria-label="Task name"
              placeholder="Task name"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-violet-600 text-white hover:bg-violet-700"
              disabled={!taskName.trim() || apply.isPending}
            >
              {apply.isPending ? "Creating…" : "Use template"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}

/** ClickUp-style template picker; mounted once per list page and opened from the add-task forms. */
function TemplatePicker() {
  const { target, closePicker } = useTemplatePicker();

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && closePicker()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="border-b border-neutral-200 px-5 py-4 pr-12 dark:border-neutral-800">
          <DialogTitle>Task templates</DialogTitle>
          <DialogDescription>Create a task with its description, subtasks, checklists and tags.</DialogDescription>
        </div>
        {target && <PickerBody target={target} onDone={closePicker} />}
      </DialogContent>
    </Dialog>
  );
}

export default TemplatePicker;
