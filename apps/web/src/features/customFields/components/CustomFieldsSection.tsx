"use client";

import SectionHeader from "@/features/taskDetail/components/SectionHeader";
import type { Task } from "@/features/task/types";
import { useCustomFields } from "../hooks";
import { AddFieldButton } from "./FieldHeader";
import FieldTypeIcon from "./FieldTypeIcon";
import ValueEditor from "./ValueEditor";

/** The task page's "Custom fields" section: every field of the task's list with its editor. */
function CustomFieldsSection({ task }: { task: Pick<Task, "id" | "name" | "listId" | "points" | "customFields"> }) {
  const { fields, isPending } = useCustomFields(task.listId);
  if (isPending || !fields) return null;

  return (
    <section className="flex flex-col gap-2" aria-label="Custom fields">
      <SectionHeader title="Custom fields" count={fields.length ? String(fields.length) : undefined}>
        <AddFieldButton
          listId={task.listId}
          fields={fields}
          sampleTask={task}
          label="Add field"
          className="ml-auto px-1.5 py-0.5 text-xs"
        />
      </SectionHeader>
      {fields.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No custom fields on this list yet. Add one to track things like severity, estimates or customers.
        </p>
      ) : (
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-neutral-200 sm:grid-cols-2 dark:border-neutral-700">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex min-h-10 items-center gap-2 border-b border-neutral-200 px-2 py-1 last:border-b-0 sm:odd:border-r sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0 dark:border-neutral-700"
            >
              <span className="flex w-32 shrink-0 items-center gap-2 truncate text-sm text-neutral-500" title={field.name}>
                <FieldTypeIcon type={field.type} />
                <span className="truncate">{field.name}</span>
              </span>
              <div className="min-w-0 flex-1">
                <ValueEditor field={field} fields={fields} task={task} listId={task.listId} variant="panel" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CustomFieldsSection;
