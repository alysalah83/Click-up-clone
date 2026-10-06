"use client";

import { useRef, useState } from "react";
import { Paperclip, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import SectionHeader from "@/features/taskDetail/components/SectionHeader";
import { useAttachments, useDeleteAttachment } from "../hooks";
import { fileKind } from "../lib";
import type { Attachment, PendingUpload } from "../types";
import AttachmentCard, { PendingCard } from "./AttachmentCard";
import AttachmentLightbox from "./AttachmentLightbox";

/**
 * ClickUp-style attachments: a grid of image thumbnails (opening a lightbox) and file cards,
 * each with Download and Delete, plus an Upload button. The whole panel also accepts drops
 * (see AttachmentsDropTarget); `upload`/`pending` come from the panel's useAttachmentUploads.
 */
function AttachmentsSection({
  taskId,
  listId,
  upload,
  pending,
}: {
  taskId: string;
  listId: string;
  upload: (files: File[]) => void;
  pending: PendingUpload[];
}) {
  const { data: attachments, isPending } = useAttachments(taskId);
  const remove = useDeleteAttachment(taskId, listId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<Attachment | null>(null);

  const all = attachments ?? [];
  const images = all.filter((a) => fileKind(a.contentType, a.fileName) === "image");
  const browse = () => inputRef.current?.click();

  const open = (attachment: Attachment) => {
    const i = images.findIndex((a) => a.id === attachment.id);
    if (i >= 0) setLightbox(i);
    else window.open(attachment.url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="flex flex-col gap-3" aria-label="attachments">
      <SectionHeader title="Attachments" count={all.length > 0 ? String(all.length) : undefined}>
        <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 text-xs" onClick={browse}>
          <Upload className="size-3.5" /> Upload
        </Button>
      </SectionHeader>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        aria-label="choose files to attach"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) upload(files);
        }}
      />

      {isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : all.length === 0 && pending.length === 0 ? (
        <button
          type="button"
          onClick={browse}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-5 text-sm text-neutral-500 transition hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-600 dark:border-neutral-700 dark:hover:border-violet-500/60 dark:hover:bg-violet-500/5 dark:hover:text-violet-300"
        >
          <Paperclip className="size-4" />
          Drop your files here or <span className="font-medium underline underline-offset-2">browse</span>
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {all.map((a) => (
            <AttachmentCard key={a.id} attachment={a} onOpen={() => open(a)} onDelete={() => setConfirming(a)} />
          ))}
          {pending.map((u) => (
            <PendingCard key={u.id} upload={u} />
          ))}
          <li>
            <button
              type="button"
              onClick={browse}
              aria-label="add attachment"
              className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-500 transition hover:border-violet-400 hover:text-violet-600 dark:border-neutral-700 dark:hover:border-violet-500/60 dark:hover:text-violet-300"
            >
              <Plus className="size-5" />
              Add file
            </button>
          </li>
        </ul>
      )}

      <AttachmentLightbox
        images={images}
        index={lightbox !== null && lightbox < images.length ? lightbox : null}
        onIndexChange={setLightbox}
        onClose={() => setLightbox(null)}
      />

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete attachment?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{confirming?.fileName}</span> will be permanently
              removed from this task.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirming) remove.mutate(confirming.id);
                setConfirming(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default AttachmentsSection;
