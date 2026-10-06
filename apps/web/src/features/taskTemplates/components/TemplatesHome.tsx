"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { LayoutTemplate, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import TagChip from "@/features/taskDetail/components/TagChip";
import { useDeleteTemplate, useTaskTemplates, useUpdateTemplate } from "../hooks";
import { filterTemplates, summaryParts } from "../lib";
import type { TaskTemplate } from "../types";
import TemplatePreview from "./TemplatePreview";

function EditDialog({ template, onClose }: { template: TaskTemplate; onClose: () => void }) {
  const update = useUpdateTemplate();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate({ id: template.id, name: name.trim(), description: description.trim() }, { onSuccess: onClose });
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Rename template</DialogTitle>
            <DialogDescription>The task it creates stays the same.</DialogDescription>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Template name" autoFocus />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
            rows={3}
            aria-label="Template description"
            placeholder="Description"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-violet-600 text-white hover:bg-violet-700" disabled={!name.trim() || update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ template, onClose }: { template: TaskTemplate; onClose: () => void }) {
  const remove = useDeleteTemplate();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{template.name}”?</DialogTitle>
          <DialogDescription>Tasks already created from it are kept.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate(template.id, { onSuccess: onClose })}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Mode = { kind: "preview" | "edit" | "delete"; template: TaskTemplate } | null;

function TemplateCard({ template, onMode }: { template: TaskTemplate; onMode: (mode: Mode) => void }) {
  const parts = summaryParts(template);
  return (
    <li className="group relative flex h-full flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-violet-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => onMode({ kind: "preview", template })}
        className="flex cursor-pointer items-start gap-2 pr-6 text-left"
      >
        <span className="rounded-md bg-violet-100 p-1.5 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <LayoutTemplate aria-hidden className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400">
            {template.name}
          </span>
          <span className="block text-xs text-muted-foreground">{template.workspace.name}</span>
        </span>
      </button>
      {template.description && <p className="line-clamp-2 text-xs text-muted-foreground">{template.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
        {template.snapshot.tags.map((tag) => (
          <TagChip key={tag.name} tag={tag} size="xs" />
        ))}
        {parts.length > 0 && <span>{parts.join(" · ")}</span>}
      </div>
      <p className="text-[11px] text-neutral-400">
        Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
      </p>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label={`${template.name} actions`}
          className="absolute top-3 right-3 flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onMode({ kind: "edit", template })}>
            <Pencil /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onMode({ kind: "delete", template })}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/** Every task template of my spaces: search, preview, rename and delete. */
function TemplatesHome() {
  const { data: templates, isPending, error } = useTaskTemplates();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>(null);
  const close = () => setMode(null);

  if (isPending)
    return (
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  if (error) return <p className="p-6 text-sm text-destructive">Could not load templates.</p>;

  const visible = filterTemplates(templates, query);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-5 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Task templates</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Use one from <strong>+ Add task</strong> on any Board, List or Table. Save a new one from a task&apos;s{" "}
            <strong>⋯</strong> menu.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search aria-hidden className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
            className="pl-8"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-muted-foreground dark:border-neutral-700">
          {templates.length === 0
            ? "No templates yet. Open a task, click ⋯ and choose Save as template."
            : "No templates match your search."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <TemplateCard key={t.id} template={t} onMode={setMode} />
          ))}
        </ul>
      )}

      {mode?.kind === "preview" && (
        <Dialog open onOpenChange={(open) => !open && close()}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogTitle className="sr-only">{mode.template.name}</DialogTitle>
            <DialogDescription className="sr-only">Template preview</DialogDescription>
            <TemplatePreview template={mode.template} />
          </DialogContent>
        </Dialog>
      )}
      {mode?.kind === "edit" && <EditDialog template={mode.template} onClose={close} />}
      {mode?.kind === "delete" && <DeleteDialog template={mode.template} onClose={close} />}
    </div>
  );
}

export default TemplatesHome;
