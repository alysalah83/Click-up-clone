"use client";

import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { downloadUrl, formatFileSize } from "../lib";
import type { Attachment } from "../types";

/** Full-size image viewer with prev/next (buttons and arrow keys) across the task's images. */
function AttachmentLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: Attachment[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const image = index === null ? undefined : images[index];
  const step = (delta: number) => {
    if (index === null || images.length < 2) return;
    onIndexChange((index + delta + images.length) % images.length);
  };

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex max-h-[92vh] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-3 border-neutral-800 bg-neutral-950 p-4 text-neutral-100 sm:max-w-none [&>[data-slot=dialog-close]]:text-neutral-300"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {image && (
          <>
            <div className="flex items-center gap-3 pr-8">
              <DialogTitle className="truncate text-sm font-medium">{image.fileName}</DialogTitle>
              <DialogDescription className="shrink-0 text-xs text-neutral-400">
                {formatFileSize(image.size)}
                {images.length > 1 && ` · ${index! + 1} of ${images.length}`}
              </DialogDescription>
              <a
                href={downloadUrl(image.url)}
                download={image.fileName}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                <Download className="size-3.5" /> Download
              </a>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={image.id}
                src={image.url}
                alt={image.fileName}
                className="max-h-[78vh] max-w-full rounded object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="previous image"
                    onClick={() => step(-1)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="next image"
                    onClick={() => step(1)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AttachmentLightbox;
