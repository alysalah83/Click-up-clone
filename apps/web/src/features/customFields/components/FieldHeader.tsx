"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/shared/lib/utils/cn";
import { useViewConfigStore } from "@/features/viewConfig/store";
import type { Task } from "@/features/task/types";
import { useCreateCustomField, useDeleteCustomField, useUpdateCustomField } from "../hooks";
import { FIELD_TYPE_LABEL } from "../lib";
import type { CustomField } from "../types";
import FieldSettingsForm from "./FieldSettingsForm";
import FieldTypeIcon from "./FieldTypeIcon";

type SampleTask = Pick<Task, "name" | "points" | "customFields">;

/** Opens a popover/dialog after the menu has closed and released focus. */
const later = (fn: () => void) => setTimeout(fn, 0);

/** A custom field column header: type icon, name, sort toggle and a menu (edit, sort, delete). */
export function FieldHeader({
  field,
  fields,
  listId,
  sampleTask,
}: {
  field: CustomField;
  fields: CustomField[];
  listId: string;
  sampleTask?: SampleTask;
}) {
  const sort = useViewConfigStore((s) => s.sort);
  const setSort = useViewConfigStore((s) => s.setSort);
  const update = useUpdateCustomField(listId);
  const remove = useDeleteCustomField(listId);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const dir = sort?.fieldId === field.id ? sort.dir : null;

  const cycleSort = () =>
    setSort(dir === null ? { fieldId: field.id, dir: "asc" } : dir === "asc" ? { fieldId: field.id, dir: "desc" } : null);

  return (
    <Popover open={editing} onOpenChange={setEditing}>
      <PopoverAnchor asChild>
        <div className="group flex h-full min-w-0 items-center gap-1 px-2" title={`${field.name} (${FIELD_TYPE_LABEL[field.type]})`}>
          <FieldTypeIcon type={field.type} className="text-neutral-400" />
          <span className="min-w-0 flex-1 truncate normal-case">{field.name}</span>
          <button
            type="button"
            aria-label={`sort by ${field.name}`}
            onClick={cycleSort}
            className={cn(
              "cursor-pointer rounded p-0.5 transition hover:bg-neutral-200 dark:hover:bg-neutral-700",
              dir ? "bg-blue-500/20 text-blue-500" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            )}
          >
            {dir === "desc" ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`${field.name} field menu`}
              className="cursor-pointer rounded p-0.5 opacity-60 transition hover:bg-neutral-200 hover:opacity-100 dark:hover:bg-neutral-700"
            >
              <ChevronDown className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FieldTypeIcon type={field.type} /> {FIELD_TYPE_LABEL[field.type]} field
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => later(() => setEditing(true))}>
                <Pencil className="size-3.5" />
                {field.type === "dropdown" ? "Rename & edit options" : field.type === "formula" ? "Edit formula" : "Rename"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort({ fieldId: field.id, dir: "asc" })}>
                <ArrowUp className="size-3.5" /> Sort ascending
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort({ fieldId: field.id, dir: "desc" })}>
                <ArrowDown className="size-3.5" /> Sort descending
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => later(() => setConfirming(true))}>
                <Trash2 className="size-3.5" /> Delete field
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-80 normal-case tracking-normal">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          <FieldTypeIcon type={field.type} /> Edit {FIELD_TYPE_LABEL[field.type].toLowerCase()} field
        </p>
        <FieldSettingsForm
          field={field}
          fields={fields}
          sampleTask={sampleTask}
          pending={update.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={({ name, config }) =>
            update.mutate(
              { id: field.id, patch: { name, ...(field.type !== "text" && field.type !== "number" && { config }) } },
              { onSuccess: () => setEditing(false) },
            )
          }
        />
      </PopoverContent>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Delete “{field.name}”?</DialogTitle>
          <DialogDescription>The column and its values on every task of this list are deleted. This can’t be undone.</DialogDescription>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer rounded px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                remove.mutate(field.id);
                if (sort?.fieldId === field.id) setSort(null);
                setConfirming(false);
              }}
              className="cursor-pointer rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete field
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}

/** The "+" at the end of the header row: add a field with a type picker. */
export function AddFieldButton({
  listId,
  fields,
  sampleTask,
  label,
  className,
}: {
  listId: string;
  fields: CustomField[];
  sampleTask?: SampleTask;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const create = useCreateCustomField(listId);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="add custom field"
        title="Add a custom field"
        className={cn(
          "flex cursor-pointer items-center justify-center gap-1 rounded text-neutral-500 transition hover:bg-neutral-200 hover:text-violet-600 dark:hover:bg-neutral-700",
          className,
        )}
      >
        <Plus className="size-4" />
        {label && <span className="text-sm">{label}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 normal-case tracking-normal">
        <p className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">Add field</p>
        {open && (
          <FieldSettingsForm
            fields={fields}
            sampleTask={sampleTask}
            pending={create.isPending}
            onCancel={() => setOpen(false)}
            onSubmit={(draft) => create.mutate(draft, { onSuccess: () => setOpen(false) })}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
