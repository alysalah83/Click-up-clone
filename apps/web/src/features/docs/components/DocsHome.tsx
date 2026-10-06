"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateDoc, useDocs, useWorkspaceNames } from "../hooks/useDocs";
import { docTitle } from "../lib";

function relativeDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DocsHome() {
  const router = useRouter();
  const { data: docs, isPending, error } = useDocs();
  const { data: spaces } = useWorkspaceNames();
  const create = useCreateDoc();
  const [spaceId, setSpaceId] = useState<string>();
  const targetSpace = spaceId ?? spaces?.[0]?.id;

  const addDoc = async (workspaceId: string | undefined) => {
    if (!workspaceId) return;
    try {
      const doc = await create.mutateAsync({ workspaceId });
      router.push(`/home/docs/${doc.id}`);
    } catch {
      toast.error("Could not create the doc");
    }
  };

  if (isPending)
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4" aria-busy="true">
        <Skeleton className="h-7 w-24" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  if (error) return <p className="p-6 text-sm text-destructive">Could not load docs.</p>;

  if (docs.length === 0)
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
        <FileText className="size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">No docs yet</h1>
        <p className="text-sm text-muted-foreground">
          Write down plans, meeting notes and guides next to your work. Pages nest, and save on their own.
        </p>
        {spaces && spaces.length > 1 && (
          <select
            aria-label="Space"
            value={targetSpace}
            onChange={(e) => setSpaceId(e.target.value)}
            className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm dark:border-neutral-700"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id} className="text-black">
                {s.name}
              </option>
            ))}
          </select>
        )}
        <Button disabled={!targetSpace || create.isPending} onClick={() => addDoc(targetSpace)}>
          Create your first doc
        </Button>
      </div>
    );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-5 sm:px-8 sm:py-8">
      <h1 className="text-lg font-semibold">Docs</h1>
      {(spaces ?? []).map((space) => {
        const spaceDocs = docs.filter((d) => d.workspaceId === space.id);
        return (
          <section key={space.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">{space.name}</h2>
              <Button variant="outline" size="sm" disabled={create.isPending} onClick={() => addDoc(space.id)}>
                New doc
              </Button>
            </div>
            {spaceDocs.length === 0 && <p className="text-sm text-muted-foreground">No docs in this space.</p>}
            <ul className="flex flex-col divide-y rounded-xl border">
              {spaceDocs.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/home/docs/${d.id}`}
                    className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-neutral-500/10"
                  >
                    <span aria-hidden className="text-lg">
                      {d.icon ?? "📄"}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{docTitle(d)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{relativeDate(d.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default DocsHome;
