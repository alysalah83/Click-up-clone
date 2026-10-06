"use client";

import {
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import { downloadUrl, extensionOf, fileKind, formatFileSize, type FileKind } from "../lib";
import type { Attachment, PendingUpload } from "../types";

const KIND_ICON: Record<FileKind, { icon: LucideIcon; tint: string }> = {
  image: { icon: FileImage, tint: "text-violet-500 bg-violet-50 dark:bg-violet-500/10" },
  pdf: { icon: FileText, tint: "text-red-500 bg-red-50 dark:bg-red-500/10" },
  doc: { icon: FileText, tint: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
  sheet: { icon: FileSpreadsheet, tint: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
  archive: { icon: FileArchive, tint: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
  video: { icon: FileVideo, tint: "text-pink-500 bg-pink-50 dark:bg-pink-500/10" },
  audio: { icon: FileAudio, tint: "text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10" },
  code: { icon: FileCode, tint: "text-neutral-600 bg-neutral-100 dark:text-neutral-300 dark:bg-neutral-800" },
  other: { icon: File, tint: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800" },
};

const CARD =
  "group relative flex h-40 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-left dark:border-neutral-700 dark:bg-neutral-900";

function AttachmentCard({
  attachment,
  onOpen,
  onDelete,
}: {
  attachment: Attachment;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const kind = fileKind(attachment.contentType, attachment.fileName);
  const { icon: Icon, tint } = KIND_ICON[kind];
  const ext = extensionOf(attachment.fileName);

  return (
    <li className={cn(CARD, "transition hover:border-violet-400 hover:shadow-sm dark:hover:border-violet-500/60")}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`open ${attachment.fileName}`}
        className="flex min-h-0 flex-1 cursor-pointer items-center justify-center overflow-hidden bg-neutral-50 dark:bg-neutral-800/60"
      >
        {kind === "image" ? (
          // Plain <img>: attachments live on another origin (Blob store / public assets).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.url}
            alt={attachment.fileName}
            loading="lazy"
            className="size-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className={cn("flex flex-col items-center gap-1 rounded-lg px-4 py-3", tint)}>
            <Icon className="size-8" strokeWidth={1.5} />
            {ext && <span className="text-[10px] font-semibold uppercase tracking-wide">{ext}</span>}
          </span>
        )}
      </button>
      <div className="flex shrink-0 flex-col border-t border-neutral-200 px-2.5 py-1.5 dark:border-neutral-700">
        <span className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-100" title={attachment.fileName}>
          {attachment.fileName}
        </span>
        <span className="text-[11px] text-neutral-500">{formatFileSize(attachment.size)}</span>
      </div>
      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
        <a
          href={downloadUrl(attachment.url)}
          download={attachment.fileName}
          target="_blank"
          rel="noreferrer"
          aria-label={`download ${attachment.fileName}`}
          title="Download"
          className="rounded-md bg-white/90 p-1.5 text-neutral-600 shadow-sm hover:text-violet-600 dark:bg-neutral-900/90 dark:text-neutral-300"
        >
          <Download className="size-3.5" />
        </a>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`delete ${attachment.fileName}`}
          title="Delete"
          className="cursor-pointer rounded-md bg-white/90 p-1.5 text-neutral-600 shadow-sm hover:text-red-500 dark:bg-neutral-900/90 dark:text-neutral-300"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}

export function PendingCard({ upload }: { upload: PendingUpload }) {
  const percent = Math.round(upload.progress * 100);
  return (
    <li className={CARD} aria-busy="true">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-neutral-50 px-4 dark:bg-neutral-800/60">
        <span className="size-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div className="h-full bg-violet-600 transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col border-t border-neutral-200 px-2.5 py-1.5 dark:border-neutral-700">
        <span className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-100">{upload.fileName}</span>
        <span className="text-[11px] text-neutral-500">{percent < 100 ? `Uploading ${percent}%` : "Processing..."}</span>
      </div>
    </li>
  );
}

export default AttachmentCard;
