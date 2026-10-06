"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDeleteForm, useUpdateForm } from "../hooks";
import {
  FIELD_TYPE_LABELS,
  FIELD_TYPES,
  MAX_FORM_FIELDS,
  changeFieldType,
  cleanDraft,
  draftProblems,
  lastSubmittedLabel,
  makeField,
  mapField,
  moveField,
  removeField,
  toPublicFields,
} from "../lib";
import type { Form, FormDraft, FormField } from "../types";
import FieldEditor from "./FieldEditor";
import FormCard from "./FormCard";
import ShareBar from "./ShareBar";
import TaskSettings from "./TaskSettings";

const card = "rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900";
const sectionTitle = "text-sm font-semibold text-neutral-900 dark:text-neutral-50";

const toDraft = (form: Form): FormDraft => ({
  title: form.title,
  description: form.description,
  isActive: form.isActive,
  statusId: form.statusId,
  priority: form.priority,
  assigneeId: form.assigneeId,
  tagIds: form.tagIds,
  fields: form.fields,
});

type SaveState = "saved" | "pending" | "saving" | "error";

/**
 * The form builder: details, fields and task settings on the left, a live preview on the right.
 * Edits go to a local draft that autosaves (debounced) whenever it is valid.
 */
function FormBuilder({ form, workspaceId }: { form: Form; workspaceId: string }) {
  const [draft, setDraft] = useState<FormDraft>(() => toDraft(form));
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const dirty = useRef(false);
  const update = useUpdateForm(form.listId);
  const remove = useDeleteForm(form.listId);
  const problems = draftProblems(draft);
  const problemCount = Object.keys(problems).length;

  const edit = (next: (d: FormDraft) => FormDraft) => {
    dirty.current = true;
    setSaveState("pending");
    setDraft(next);
  };
  const editFields = (next: (fields: FormField[]) => FormField[]) => edit((d) => ({ ...d, fields: next(d.fields) }));
  const patchField = (id: string, patch: Partial<FormField>) =>
    editFields((fields) => fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const { mutate } = update;
  useEffect(() => {
    if (!dirty.current || Object.keys(draftProblems(draft)).length > 0) return;
    const timer = setTimeout(() => {
      dirty.current = false;
      setSaveState("saving");
      mutate(
        { id: form.id, patch: cleanDraft(draft) },
        {
          onSuccess: () => setSaveState(dirty.current ? "pending" : "saved"),
          onError: () => setSaveState("error"),
        },
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [draft, form.id, mutate]);

  const saveLabel =
    problemCount > 0
      ? `Fix ${problemCount} ${problemCount === 1 ? "issue" : "issues"} to save`
      : { saved: "All changes saved", pending: "Unsaved changes…", saving: "Saving…", error: "Could not save" }[saveState];

  const deleteForm = () => {
    if (window.confirm(`Delete "${form.title}"? Its link stops working. Tasks it created stay.`)) remove.mutate(form.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={draft.isActive}
          onClick={() => edit((d) => ({ ...d, isActive: !d.isActive }))}
          className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200"
        >
          <span
            className={`relative h-5 w-9 rounded-full transition ${draft.isActive ? "bg-violet-600" : "bg-neutral-300 dark:bg-neutral-700"}`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${draft.isActive ? "left-4.5" : "left-0.5"}`}
            />
          </span>
          {draft.isActive ? "Active" : "Inactive"}
        </button>
        <span className="text-xs text-neutral-500">
          {draft.isActive ? "Accepting responses" : "The link shows “not available”"}
        </span>
        <span
          className={`ml-auto text-xs ${problemCount > 0 || saveState === "error" ? "text-red-600 dark:text-red-400" : "text-neutral-500"}`}
          aria-live="polite"
        >
          {saveLabel}
        </span>
        <button
          type="button"
          onClick={deleteForm}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        >
          <Trash2 className="size-3.5" /> Delete form
        </button>
      </div>

      <ShareBar slug={form.slug} isActive={draft.isActive} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <section className={`${card} flex flex-col gap-3`}>
            <h3 className={sectionTitle}>Form details</h3>
            <Input
              aria-label="Form title"
              aria-invalid={!!problems.title || undefined}
              value={draft.title}
              maxLength={120}
              placeholder="Form title"
              onChange={(e) => edit((d) => ({ ...d, title: e.target.value }))}
              className="text-base font-semibold"
            />
            <Textarea
              aria-label="Form description"
              value={draft.description}
              maxLength={1000}
              rows={3}
              placeholder="Tell people what this form is for (optional)"
              onChange={(e) => edit((d) => ({ ...d, description: e.target.value }))}
            />
          </section>

          <section className={`${card} flex flex-col gap-3`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className={sectionTitle}>
                Fields <span className="font-normal text-neutral-400">{draft.fields.length}</span>
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={draft.fields.length >= MAX_FORM_FIELDS}
                    className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Plus className="size-3.5" /> Add field
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {FIELD_TYPES.map((t) => (
                    <DropdownMenuItem key={t} onSelect={() => editFields((fields) => [...fields, makeField(t)])}>
                      {FIELD_TYPE_LABELS[t]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ol className="flex flex-col gap-2">
              {draft.fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  count={draft.fields.length}
                  problem={problems[field.id]}
                  onChange={(patch) => patchField(field.id, patch)}
                  onType={(type) => editFields((fields) => changeFieldType(fields, field.id, type))}
                  onMap={(target) => editFields((fields) => mapField(fields, field.id, target))}
                  onMove={(delta) => editFields((fields) => moveField(fields, field.id, delta))}
                  onRemove={() => editFields((fields) => removeField(fields, field.id))}
                />
              ))}
            </ol>
          </section>

          <section className={`${card} flex flex-col gap-3`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className={sectionTitle}>Created tasks</h3>
              <span className="text-xs text-neutral-500">
                <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{form.submissionCount}</strong>{" "}
                {form.submissionCount === 1 ? "response" : "responses"} · {lastSubmittedLabel(form.lastSubmittedAt)}
              </span>
            </div>
            <TaskSettings
              listId={form.listId}
              workspaceId={workspaceId}
              draft={draft}
              onChange={(patch) => edit((d) => ({ ...d, ...patch }))}
            />
            <Link
              href={`/home/lists/${form.listId}/list`}
              className="self-start text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              See the tasks in this list
            </Link>
          </section>
        </div>

        <section aria-label="Live preview" className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-4">
          <h3 className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">Live preview</h3>
          <div className="rounded-2xl bg-neutral-100 p-3 sm:p-5 dark:bg-neutral-950">
            <FormCard
              mode="preview"
              form={{ title: draft.title, description: draft.description, fields: toPublicFields(draft.fields) }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default FormBuilder;
