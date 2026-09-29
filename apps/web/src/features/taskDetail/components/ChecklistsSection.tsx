"use client";

import { useState } from "react";
import Checkbox from "@/shared/ui/CheckBox";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";
import {
  createChecklistAction,
  createChecklistItemAction,
  deleteChecklistAction,
  deleteChecklistItemAction,
  updateChecklistItemAction,
} from "../actions/taskDetail.actions";
import { useTaskDetailMutation } from "../hooks/useTaskDetail";
import type { Checklist, ChecklistItem, TaskDetail } from "../types";
import ProgressBar from "./ProgressBar";
import SectionHeader from "./SectionHeader";

type Mutations = ReturnType<typeof useChecklistMutations>;

const mapItems = (
  d: TaskDetail,
  map: (item: ChecklistItem) => ChecklistItem | null,
): TaskDetail => ({
  ...d,
  checklists: d.checklists.map((c) => ({
    ...c,
    items: c.items.map(map).filter((i): i is ChecklistItem => i !== null),
  })),
});

function useChecklistMutations(taskId: string, listId: string) {
  const toggle = useTaskDetailMutation(
    taskId,
    listId,
    (item: ChecklistItem) =>
      updateChecklistItemAction(item.id, { done: !item.done }, listId),
    (d, item) =>
      mapItems(d, (i) => (i.id === item.id ? { ...i, done: !item.done } : i)),
  );
  const removeItem = useTaskDetailMutation(
    taskId,
    listId,
    (item: ChecklistItem) => deleteChecklistItemAction(item.id, listId),
    (d, item) => mapItems(d, (i) => (i.id === item.id ? null : i)),
  );
  const addItem = useTaskDetailMutation(
    taskId,
    listId,
    ({ checklistId, text }: { checklistId: string; text: string }) =>
      createChecklistItemAction(checklistId, text, listId),
    (d, { checklistId, text }) => ({
      ...d,
      checklists: d.checklists.map((c) =>
        c.id === checklistId
          ? {
              ...c,
              items: [
                ...c.items,
                {
                  id: `temp-${Date.now()}`,
                  checklistId,
                  text,
                  done: false,
                  order: c.items.length,
                  assigneeId: null,
                },
              ],
            }
          : c,
      ),
    }),
  );
  const removeChecklist = useTaskDetailMutation(
    taskId,
    listId,
    (checklist: Checklist) => deleteChecklistAction(checklist.id, listId),
    (d, checklist) => ({
      ...d,
      checklists: d.checklists.filter((c) => c.id !== checklist.id),
    }),
  );
  return { toggle, removeItem, addItem, removeChecklist };
}

function ChecklistCard({
  checklist,
  mutations,
}: {
  checklist: Checklist;
  mutations: Mutations;
}) {
  const [text, setText] = useState("");
  const done = checklist.items.filter((i) => i.done).length;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
          {checklist.name}
        </span>
        <span className="text-xs text-neutral-500">
          {done}/{checklist.items.length}
        </span>
        <ProgressBar done={done} total={checklist.items.length} />
        <button
          type="button"
          aria-label={`delete checklist ${checklist.name}`}
          onClick={() => mutations.removeChecklist.mutate(checklist)}
          className="ml-auto cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-red-500 dark:hover:bg-neutral-700"
        >
          <ICONS_MAP.trash className="size-4" />
        </button>
      </header>
      <ul className="flex flex-col py-1">
        {checklist.items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2.5 px-3 py-1.5 text-sm"
          >
            <Checkbox
              checked={item.done}
              disabled={item.id.startsWith("temp-")}
              onCheckedChange={() => mutations.toggle.mutate(item)}
            />
            <span
              className={cn(
                "flex-1 text-neutral-800 dark:text-neutral-200",
                item.done &&
                  "text-neutral-400 line-through dark:text-neutral-500",
              )}
            >
              {item.text}
            </span>
            {!item.id.startsWith("temp-") && (
              <button
                type="button"
                aria-label={`delete item ${item.text}`}
                onClick={() => mutations.removeItem.mutate(item)}
                className="cursor-pointer text-neutral-400 opacity-0 transition hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <ICONS_MAP.close className="size-4" />
              </button>
            )}
          </li>
        ))}
        <li>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = text.trim();
              if (!trimmed) return;
              mutations.addItem.mutate({
                checklistId: checklist.id,
                text: trimmed,
              });
              setText("");
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 text-sm"
          >
            <ICONS_MAP.plus className="size-3 text-neutral-400" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add item"
              aria-label={`new item in ${checklist.name}`}
              maxLength={256}
              className="w-full bg-transparent outline-none placeholder:text-neutral-500"
            />
          </form>
        </li>
      </ul>
    </div>
  );
}

function ChecklistsSection({ detail }: { detail: TaskDetail }) {
  const { id: taskId, listId, checklists } = detail;
  const mutations = useChecklistMutations(taskId, listId);
  const create = useTaskDetailMutation(taskId, listId, (name: string) =>
    createChecklistAction(taskId, name, listId),
  );

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title="Checklists">
        <button
          type="button"
          disabled={create.isPending}
          onClick={() =>
            create.mutate(
              checklists.length === 0
                ? "Checklist"
                : `Checklist ${checklists.length + 1}`,
            )
          }
          className="ml-auto flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-200 disabled:opacity-60 dark:hover:bg-neutral-700"
        >
          <ICONS_MAP.plus className="size-3" /> Add checklist
        </button>
      </SectionHeader>
      {checklists.map((checklist) => (
        <ChecklistCard
          key={checklist.id}
          checklist={checklist}
          mutations={mutations}
        />
      ))}
    </section>
  );
}

export default ChecklistsSection;
