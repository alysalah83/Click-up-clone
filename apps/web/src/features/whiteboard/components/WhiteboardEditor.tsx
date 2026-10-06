"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import MiniSpinner from "@/shared/ui/MiniSpinner";
import { useDeleteWhiteboard, useUpdateWhiteboard, useWhiteboard } from "../hooks/useWhiteboards";
import { boardTitle } from "../lib";
import BoardCanvas, { type SaveState } from "./BoardCanvas";

function SavedIndicator({ state }: { state: SaveState }) {
  const text = { idle: "", saving: "Saving…", saved: "Saved", error: "Not saved" }[state];
  return (
    <span
      role="status"
      aria-live="polite"
      className={`text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}
    >
      {text}
    </span>
  );
}

/** One board: a slim bar (back link, title, save state, delete) over the full-size canvas. */
function WhiteboardEditor({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { data: board, isPending, error } = useWhiteboard(boardId);
  const { mutate: rename } = useUpdateWhiteboard();
  const { mutateAsync: remove, isPending: isDeleting } = useDeleteWhiteboard();
  const [saveState, setSaveState] = useState<SaveState>("idle");

  if (isPending)
    return (
      <div className="flex h-full min-h-[480px] items-center justify-center" aria-busy="true">
        <MiniSpinner bgColor="bg-neutral-900 dark:bg-neutral-200" width="large" padding="p-1.5" />
      </div>
    );
  if (error || !board)
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
        <h1 className="text-lg font-semibold">Whiteboard not found</h1>
        <p className="text-sm text-muted-foreground">It may have been deleted, or it belongs to a space you left.</p>
        <Link href="/home/whiteboards" className="text-sm text-violet-600 hover:underline">
          All whiteboards
        </Link>
      </div>
    );

  const commitTitle = (value: string) => {
    if (value.trim() === board.title.trim()) return;
    rename({ id: board.id, patch: { title: value.trim() } }, { onError: () => toast.error("Could not rename") });
  };

  const onDelete = async () => {
    if (!window.confirm(`Delete "${boardTitle(board)}"?`)) return;
    try {
      await remove(board.id);
      router.push("/home/whiteboards");
    } catch {
      toast.error("Could not delete the whiteboard");
    }
  };

  return (
    <div className="flex h-[calc(100dvh-5rem)] min-h-[480px] flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-1.5 sm:px-4">
        <Link href="/home/whiteboards" className="shrink-0 text-xs text-muted-foreground hover:underline">
          All whiteboards
        </Link>
        <span aria-hidden className="text-muted-foreground">
          /
        </span>
        <input
          key={board.id}
          defaultValue={board.title}
          placeholder="Untitled whiteboard"
          maxLength={200}
          aria-label="Whiteboard title"
          onBlur={(e) => commitTitle(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="min-w-0 flex-1 truncate rounded bg-transparent px-1 py-0.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-violet-400"
        />
        <SavedIndicator state={saveState} />
        <Button variant="ghost" size="icon" aria-label="Delete whiteboard" disabled={isDeleting} onClick={onDelete}>
          <Trash2 />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <BoardCanvas key={board.id} board={board} onSaveState={setSaveState} />
      </div>
    </div>
  );
}

export default WhiteboardEditor;
