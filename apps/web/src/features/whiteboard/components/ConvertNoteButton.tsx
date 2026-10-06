"use client";

import { useState } from "react";
import { CheckSquare, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useMyLists } from "../hooks/useWhiteboards";

interface ConvertNoteButtonProps {
  workspaceId: string;
  text: string;
  /** Link of the task when the note was already converted. */
  taskLink: string | null;
  position: { left: number; top: number };
  isPending: boolean;
  onConvert: (listId: string) => void;
  onOpenTask: (href: string) => void;
}

/** Floating action above the selected sticky note (ClickUp style): convert it, or open its task. */
function ConvertNoteButton({
  workspaceId,
  text,
  taskLink,
  position,
  isPending,
  onConvert,
  onOpenTask,
}: ConvertNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: lists, isPending: listsPending } = useMyLists();
  const spaceLists = (lists ?? []).filter((l) => l.workspaceId === workspaceId);
  const [listId, setListId] = useState<string>();
  const target = listId ?? spaceLists[0]?.id;

  const pill =
    "flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-md hover:bg-violet-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

  return (
    <div className="absolute z-10 -translate-x-1/2" style={{ left: position.left, top: position.top }}>
      {taskLink ? (
        <button type="button" className={pill} onClick={() => onOpenTask(taskLink)}>
          <ExternalLink className="size-3.5 text-emerald-600" aria-hidden />
          Open task
        </button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={pill}>
              <CheckSquare className="size-3.5 text-violet-600" aria-hidden />
              Convert to task
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" side="bottom" align="center">
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!target) return;
                onConvert(target);
                setOpen(false);
              }}
            >
              <p className="line-clamp-2 text-sm font-medium" title={text}>
                {text}
              </p>
              <label className="text-xs text-muted-foreground" htmlFor="note-task-list">
                Add to list
              </label>
              {spaceLists.length > 0 ? (
                <select
                  id="note-task-list"
                  value={target}
                  onChange={(e) => setListId(e.target.value)}
                  className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm dark:border-neutral-700"
                >
                  {spaceLists.map((l) => (
                    <option key={l.id} value={l.id} className="text-black">
                      {l.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {listsPending ? "Loading lists…" : "This space has no lists yet."}
                </p>
              )}
              <Button type="submit" size="sm" disabled={!target || isPending}>
                {isPending ? "Creating…" : "Create task"}
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default ConvertNoteButton;
