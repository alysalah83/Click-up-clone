"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentList } from "@/features/sprint/components/SprintBar";
import { useCreateForm, useListForms } from "../hooks";
import FormBuilder from "./FormBuilder";

/** The list's Form view: pick one of its forms (or create the first) and edit it in the builder. */
function FormView() {
  const { listId } = useParams<{ listId: string }>();
  const list = useCurrentList();
  const { data: forms, isPending, error } = useListForms(listId);
  const create = useCreateForm(listId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (error) return <p className="p-8 text-center text-sm text-neutral-500">The forms of this list could not load.</p>;
  if (isPending || !forms || !list)
    return (
      <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-8">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );

  const selected = forms.find((f) => f.id === selectedId) ?? forms[0];
  const createForm = () => create.mutate(undefined, { onSuccess: (form) => setSelectedId(form.id) });

  if (!selected)
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
            <ClipboardList className="size-7" />
          </span>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Collect requests with a form</h2>
          <p className="text-sm text-neutral-500">
            Share a public link. Every response becomes a task in <strong>{list.name}</strong>, no login needed.
          </p>
          <button
            type="button"
            onClick={createForm}
            disabled={create.isPending}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
          >
            <Plus className="size-4" /> {create.isPending ? "Creating…" : "Create form"}
          </button>
        </div>
      </main>
    );

  return (
    <main className="flex flex-col gap-4 p-3 text-neutral-600 sm:p-4 lg:p-8 dark:text-neutral-400">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">Forms</h2>
        <nav aria-label="Forms of this list" className="flex flex-wrap gap-1">
          {forms.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-current={f.id === selected.id ? "true" : undefined}
              onClick={() => setSelectedId(f.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm transition ${
                f.id === selected.id
                  ? "bg-violet-100 font-medium text-violet-900 dark:bg-violet-500/20 dark:text-violet-100"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              <span className={`size-1.5 rounded-full ${f.isActive ? "bg-emerald-500" : "bg-neutral-400"}`} />
              {f.title}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={createForm}
          disabled={create.isPending}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-60 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <Plus className="size-4" /> New form
        </button>
      </header>
      <FormBuilder key={selected.id} form={selected} workspaceId={list.workspaceId} />
    </main>
  );
}

export default FormView;
