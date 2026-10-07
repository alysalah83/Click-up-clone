"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils/cn";
import { fetchPublicShare, pageTitle, pageTree, timeAgo, type PageNode } from "../lib";
import type { PublicShareDoc, PublicSharePage } from "../types";
import RichTextView from "./RichTextView";

function TreeItem({ node, depth, selectedId, onSelect }: { node: PageNode; depth: number; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        aria-current={selectedId === node.id ? "page" : undefined}
        style={{ paddingLeft: `${0.5 + depth * 0.875}rem` }}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition",
          selectedId === node.id
            ? "bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300"
            : "text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-300 dark:hover:bg-neutral-800",
        )}
      >
        <span className="shrink-0 text-base leading-none">{node.icon ?? <FileText className="size-4 text-neutral-400" />}</span>
        <span className="truncate">{pageTitle(node)}</span>
      </button>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Page({ page }: { page: PublicSharePage }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-tight sm:text-4xl">{page.icon ?? "📄"}</span>
        <h1 className="min-w-0 flex-1 text-2xl font-bold tracking-tight break-words sm:text-3xl">{pageTitle(page)}</h1>
      </div>
      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
        {page.authorName ? `By ${page.authorName} · ` : ""}Updated {timeAgo(page.updatedAt)}
      </p>
      {page.content ? (
        <RichTextView key={page.id} content={page.content} variant="doc" className="py-2" />
      ) : (
        <p className="py-6 text-sm text-muted-foreground">This page is empty.</p>
      )}
    </article>
  );
}

type Load = { state: "loading" } | { state: "error" } | { state: "ready"; page: PublicSharePage };

/** A sub-page, loaded on demand (the API only serves pages below the shared doc). */
function SubPage({ token, id }: { token: string; id: string }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  useEffect(() => {
    let cancelled = false;
    fetchPublicShare<PublicSharePage>(token, `/pages/${encodeURIComponent(id)}`)
      .then((page) => !cancelled && setLoad({ state: "ready", page }))
      .catch(() => !cancelled && setLoad({ state: "error" }));
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  if (load.state === "loading")
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (load.state === "error") return <p className="text-sm text-muted-foreground">This page is not available.</p>;
  return <Page page={load.page} />;
}

/** The shared doc with the editor's typography, and a tree of its sub-pages when it has any. */
function PublicDocView({ token, doc }: { token: string; doc: PublicShareDoc }) {
  const [selectedId, setSelectedId] = useState(doc.id);
  const tree = pageTree(doc.id, doc.pages);
  const root: PageNode = { id: doc.id, parentId: null, title: doc.title, icon: doc.icon, children: tree };

  const select = (id: string) => {
    setSelectedId(id);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-6 md:py-10">
      {tree.length > 0 && (
        <nav aria-label="Pages" className="shrink-0 md:sticky md:top-20 md:h-fit md:w-60">
          <p className="mb-1.5 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Pages</p>
          <ul className="rounded-lg border border-neutral-200 p-1 md:border-0 md:p-0 dark:border-neutral-800">
            <TreeItem node={root} depth={0} selectedId={selectedId} onSelect={select} />
          </ul>
        </nav>
      )}
      <div className="mx-auto w-full max-w-3xl min-w-0">
        {selectedId === doc.id ? <Page page={doc} /> : <SubPage key={selectedId} token={token} id={selectedId} />}
      </div>
    </div>
  );
}

export default PublicDocView;
