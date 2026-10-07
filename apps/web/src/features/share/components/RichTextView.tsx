"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { cn } from "@/shared/lib/utils/cn";
import type { RichTextNode } from "../types";

/**
 * Read-only Tiptap with the editors' extensions and typography (`task-description`, plus
 * `doc-body` for docs). The content was already sanitized by the API.
 */
function RichTextView({ content, variant = "task", className }: { content: RichTextNode; variant?: "task" | "doc"; className?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: { openOnClick: true, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" } },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: content as JSONContent,
    editorProps: {
      attributes: {
        class: cn("task-description outline-none", variant === "doc" && "doc-body", className),
        "aria-label": variant === "doc" ? "Doc content" : "Task description",
        "aria-readonly": "true",
      },
    },
  });

  return <EditorContent editor={editor} />;
}

export default RichTextView;
