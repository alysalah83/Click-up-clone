"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Shapes } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceNames } from "@/features/docs/hooks/useDocs";
import { useCreateWhiteboard, useWhiteboards } from "../hooks/useWhiteboards";
import { boardTitle } from "../lib";
import type { WhiteboardSummary } from "../types";

const STICKY_COLORS = ["bg-amber-200", "bg-rose-200", "bg-violet-200", "bg-sky-200", "bg-emerald-200"];

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** A decorative thumbnail: a few sticky notes, varied per board so cards do not look identical. */
function Thumbnail({ seed }: { seed: string }) {
  const offset = [...seed].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return (
    <div aria-hidden className="grid h-28 grid-cols-4 content-center gap-2 bg-neutral-100 px-5 dark:bg-neutral-800/60">
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className={`h-7 rounded-sm shadow-sm ${STICKY_COLORS[(offset + i * 3) % STICKY_COLORS.length]} ${i % 3 === 1 ? "rotate-2" : i % 3 === 2 ? "-rotate-2" : ""}`}
        />
      ))}
    </div>
  );
}

function BoardCard({ board }: { board: WhiteboardSummary }) {
  return (
    <li>
      <Link
        href={`/home/whiteboards/${board.id}`}
        className="flex flex-col overflow-hidden rounded-xl border transition hover:border-violet-400 hover:shadow-md"
      >
        <Thumbnail seed={board.id} />
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Shapes aria-hidden className="size-4 shrink-0 text-violet-500" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{boardTitle(board)}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{shortDate(board.updatedAt)}</span>
        </div>
      </Link>
    </li>
  );
}

/** Every board, grouped by space, as cards; each space can start a new one. */
function WhiteboardsHome() {
  const router = useRouter();
  const { data: boards, isPending, error } = useWhiteboards();
  const { data: spaces } = useWorkspaceNames();
  const create = useCreateWhiteboard();

  const addBoard = async (workspaceId: string) => {
    try {
      const board = await create.mutateAsync({ workspaceId, title: "Untitled whiteboard" });
      router.push(`/home/whiteboards/${board.id}`);
    } catch {
      toast.error("Could not create the whiteboard");
    }
  };

  if (isPending)
    return (
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  if (error) return <p className="p-6 text-sm text-destructive">Could not load whiteboards.</p>;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-5 sm:px-8 sm:py-8">
      <div>
        <h1 className="text-lg font-semibold">Whiteboards</h1>
        <p className="text-sm text-muted-foreground">
          Brainstorm with sticky notes, then turn the good ones into tasks.
        </p>
      </div>
      {(spaces ?? []).map((space) => {
        const spaceBoards = boards.filter((b) => b.workspaceId === space.id);
        return (
          <section key={space.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">{space.name}</h2>
              <Button variant="outline" size="sm" disabled={create.isPending} onClick={() => addBoard(space.id)}>
                <Plus /> New whiteboard
              </Button>
            </div>
            {spaceBoards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No whiteboards in this space.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spaceBoards.map((b) => (
                  <BoardCard key={b.id} board={b} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default WhiteboardsHome;
