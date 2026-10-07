"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useMyLists, useTurnIntoTask } from "../hooks/useChat";
import { taskHref } from "../lib";
import type { ChatMessage } from "../types";

interface TurnIntoTaskProps {
  message: ChatMessage;
  workspaceId: string;
  onOpenChange: (open: boolean) => void;
  triggerClassName: string;
}

/** Hover action: pick a list of the channel's space, create the task, toast with "Open task". */
function TurnIntoTask({ message, workspaceId, onOpenChange, triggerClassName }: TurnIntoTaskProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: lists, isPending: listsPending } = useMyLists();
  const spaceLists = (lists ?? []).filter((l) => l.workspaceId === workspaceId);
  const [listId, setListId] = useState<string>();
  const target = listId ?? spaceLists[0]?.id;
  const turn = useTurnIntoTask(message.channelId);

  const setBoth = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };

  const create = () => {
    if (!target) return;
    turn.mutate(
      { id: message.id, listId: target },
      {
        onSuccess: ({ task }) => {
          setBoth(false);
          toast.success(`Task created: ${task.name}`, {
            action: { label: "Open task", onClick: () => router.push(taskHref(task)) },
          });
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Could not create the task"),
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setBoth}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Turn into task" title="Turn into task" className={triggerClassName}>
          <CheckSquare className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <p className="text-sm font-semibold">Turn into task</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            The first line becomes the task name; the whole message goes into its description.
          </p>
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`chat-task-list-${message.id}`}>
            Add to list
          </label>
          {spaceLists.length > 0 ? (
            <select
              id={`chat-task-list-${message.id}`}
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
          <Button type="submit" size="sm" disabled={!target || turn.isPending}>
            {turn.isPending ? "Creating…" : "Create task"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export default TurnIntoTask;
