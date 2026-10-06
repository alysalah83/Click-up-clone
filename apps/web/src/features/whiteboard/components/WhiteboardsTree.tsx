"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Shapes } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils/cn";
import {
  useCreateWhiteboard,
  useDeleteWhiteboard,
  useUpdateWhiteboard,
  useWhiteboards,
} from "../hooks/useWhiteboards";
import { boardTitle } from "../lib";
import type { WhiteboardSummary } from "../types";

function BoardRow({ board }: { board: WhiteboardSummary }) {
  const router = useRouter();
  const { boardId } = useParams<{ boardId?: string }>();
  const update = useUpdateWhiteboard();
  const remove = useDeleteWhiteboard();
  const [renaming, setRenaming] = useState(false);
  const active = boardId === board.id;

  const commitRename = (value: string) => {
    setRenaming(false);
    if (value.trim() === board.title.trim()) return;
    update.mutate(
      { id: board.id, patch: { title: value.trim() } },
      { onError: () => toast.error("Could not rename") },
    );
  };

  const onDelete = async () => {
    if (!window.confirm(`Delete "${boardTitle(board)}"?`)) return;
    try {
      await remove.mutateAsync(board.id);
      if (active) router.push("/home/whiteboards");
    } catch {
      toast.error("Could not delete the whiteboard");
    }
  };

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 pl-1 text-sm hover:bg-neutral-500/15",
          active && "bg-violet-500/15 font-medium text-violet-700 dark:text-violet-300",
        )}
      >
        <Shapes aria-hidden className="size-3.5 shrink-0 text-violet-500" />
        {renaming ? (
          <input
            autoFocus
            defaultValue={board.title}
            maxLength={200}
            aria-label="Rename whiteboard"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => commitRename(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="mx-1 min-w-0 flex-1 rounded border border-violet-400 bg-transparent px-1 py-0.5 outline-none"
          />
        ) : (
          <Link href={`/home/whiteboards/${board.id}`} className="min-w-0 flex-1 truncate py-1.5 pl-1">
            {boardTitle(board)}
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${boardTitle(board)}`}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-100 hover:bg-neutral-500/20 data-[state=open]:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

/** The boards of one space in the sidebar, under its docs, with new / rename / delete. */
function WhiteboardsTree({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { data: boards, isPending, error } = useWhiteboards();
  const create = useCreateWhiteboard();

  const addBoard = async () => {
    try {
      const board = await create.mutateAsync({ workspaceId, title: "Untitled whiteboard" });
      router.push(`/home/whiteboards/${board.id}`);
    } catch {
      toast.error("Could not create the whiteboard");
    }
  };

  const spaceBoards = (boards ?? []).filter((b) => b.workspaceId === workspaceId);

  return (
    <div className="ml-auto flex w-[92%] flex-col gap-1 border-l border-neutral-300 pl-3 dark:border-neutral-700">
      <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        <span>Whiteboards</span>
        <button
          type="button"
          aria-label="New whiteboard"
          onClick={addBoard}
          disabled={create.isPending}
          className="flex size-6 cursor-pointer items-center justify-center rounded hover:bg-neutral-500/20"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {isPending && <Skeleton className="h-6 w-full" />}
      {error && <p className="text-xs text-destructive">Could not load whiteboards.</p>}
      {boards && spaceBoards.length === 0 && (
        <button
          type="button"
          onClick={addBoard}
          className="cursor-pointer rounded-md px-1 py-1 text-left text-xs text-neutral-500 hover:bg-neutral-500/15"
        >
          + New whiteboard
        </button>
      )}
      {spaceBoards.length > 0 && (
        <ul className="flex flex-col">
          {spaceBoards.map((board) => (
            <BoardRow key={board.id} board={board} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default WhiteboardsTree;
