"use client";

import { useRef, useState, type ReactNode } from "react";
import { Paperclip } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";

const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

/**
 * Makes the whole task panel a drop zone: dragging files over it shows a
 * "Drop files to attach" overlay, and dropping uploads them.
 */
function AttachmentsDropTarget({
  onFiles,
  className,
  children,
}: {
  onFiles: (files: File[]) => void;
  className?: string;
  children: ReactNode;
}) {
  // dragenter/dragleave fire for every child element: count them to know when the drag really left.
  const depth = useRef(0);
  const [over, setOver] = useState(false);

  return (
    <div
      className={cn("relative", className)}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) onFiles(files);
      }}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-violet-500 bg-violet-50/90 text-violet-700 backdrop-blur-[1px] dark:bg-violet-950/80 dark:text-violet-200">
          <span className="rounded-full bg-violet-600 p-3 text-white shadow-lg">
            <Paperclip className="size-6" />
          </span>
          <p className="text-lg font-semibold">Drop files to attach</p>
          <p className="text-xs text-violet-600/80 dark:text-violet-300/80">Up to 4 MB per file</p>
        </div>
      )}
    </div>
  );
}

export default AttachmentsDropTarget;
