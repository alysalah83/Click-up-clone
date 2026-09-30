"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils/cn";
import { useCreateDoc, useDeleteDoc, useDocs, useUpdateDoc } from "../hooks/useDocs";
import { buildTree, descendantIds, docTitle } from "../lib";
import type { DocNode } from "../types";

function DocRow({ node, depth }: { node: DocNode; depth: number }) {
  const router = useRouter();
  const { docId } = useParams<{ docId?: string }>();
  const create = useCreateDoc();
  const update = useUpdateDoc();
  const remove = useDeleteDoc();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const active = docId === node.id;
  const hasChildren = node.children.length > 0;

  const addSubPage = async () => {
    try {
      const doc = await create.mutateAsync({ workspaceId: node.workspaceId, parentId: node.id });
      setOpen(true);
      router.push(`/home/docs/${doc.id}`);
    } catch {
      toast.error("Could not create the page");
    }
  };

  const commitRename = (value: string) => {
    setRenaming(false);
    if (value.trim() === node.title.trim()) return;
    update.mutate({ id: node.id, patch: { title: value.trim() } }, { onError: () => toast.error("Could not rename") });
  };

  const onDelete = async () => {
    const extra = descendantIds(node).length - 1;
    const message = extra ? `Delete "${docTitle(node)}" and its ${extra} sub-page(s)?` : `Delete "${docTitle(node)}"?`;
    if (!window.confirm(message)) return;
    try {
      await remove.mutateAsync(node.id);
      if (docId && descendantIds(node).includes(docId)) router.push("/home/docs");
    } catch {
      toast.error("Could not delete the page");
    }
  };

  return (
    <li>
      <div
        style={{ paddingLeft: depth * 12 }}
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 text-sm hover:bg-neutral-500/15",
          active && "bg-violet-500/15 font-medium text-violet-700 dark:text-violet-300",
        )}
      >
        <button
          type="button"
          aria-label={open ? "Collapse" : "Expand"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn("flex size-6 shrink-0 cursor-pointer items-center justify-center", !hasChildren && "invisible")}
        >
          <ChevronRight className={cn("size-3.5 transition", open && "rotate-90")} />
        </button>
        <span aria-hidden className="shrink-0 text-sm">
          {node.icon ?? "📄"}
        </span>
        {renaming ? (
          <input
            autoFocus
            defaultValue={node.title}
            maxLength={200}
            aria-label="Rename page"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => commitRename(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="mx-1 min-w-0 flex-1 rounded border border-violet-400 bg-transparent px-1 py-0.5 outline-none"
          />
        ) : (
          <Link href={`/home/docs/${node.id}`} className="min-w-0 flex-1 truncate py-1.5 pl-1">
            {docTitle(node)}
          </Link>
        )}
        <button
          type="button"
          aria-label={`Add page inside ${docTitle(node)}`}
          onClick={addSubPage}
          disabled={create.isPending}
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-100 hover:bg-neutral-500/20 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Plus className="size-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${docTitle(node)}`}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded opacity-100 hover:bg-neutral-500/20 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onSelect={addSubPage}>Add sub-page</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && hasChildren && (
        <ul>
          {node.children.map((child) => (
            <DocRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** The pages of one space in the sidebar, nested, with add / rename / delete. */
function DocsTree({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { data: docs, isPending, error } = useDocs();
  const create = useCreateDoc();

  const addDoc = async () => {
    try {
      const doc = await create.mutateAsync({ workspaceId });
      router.push(`/home/docs/${doc.id}`);
    } catch {
      toast.error("Could not create the doc");
    }
  };

  const tree = buildTree((docs ?? []).filter((d) => d.workspaceId === workspaceId));

  return (
    <div className="ml-auto flex w-[92%] flex-col gap-1 border-l border-neutral-300 pl-3 dark:border-neutral-700">
      <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        <span>Docs</span>
        <button
          type="button"
          aria-label="New doc"
          onClick={addDoc}
          disabled={create.isPending}
          className="flex size-6 cursor-pointer items-center justify-center rounded hover:bg-neutral-500/20"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {isPending && <Skeleton className="h-6 w-full" />}
      {error && <p className="text-xs text-destructive">Could not load docs.</p>}
      {docs && tree.length === 0 && (
        <button
          type="button"
          onClick={addDoc}
          className="cursor-pointer rounded-md px-1 py-1 text-left text-xs text-neutral-500 hover:bg-neutral-500/15"
        >
          Create your first doc
        </button>
      )}
      {tree.length > 0 && (
        <ul className="flex flex-col">
          {tree.map((node) => (
            <DocRow key={node.id} node={node} depth={0} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default DocsTree;
