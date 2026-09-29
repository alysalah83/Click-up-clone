"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { cn } from "@/shared/lib/utils/cn";
import { updateDescriptionAction } from "../actions/taskDetail.actions";
import { useTaskDetailMutation } from "../hooks/useTaskDetail";

const SAVE_DELAY_MS = 1200;

function ToolbarButton({
  label,
  isActive,
  onClick,
  children,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isActive}
      // Keep the editor's selection: act on mousedown without stealing focus.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex h-7 min-w-7 cursor-pointer items-center justify-center rounded px-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700",
        isActive && "bg-violet-500/15 text-violet-600 dark:text-violet-300",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      code: e.isActive("code") || e.isActive("codeBlock"),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 px-1.5 py-1 dark:border-neutral-700">
      <ToolbarButton
        label="Bold"
        isActive={state.bold}
        onClick={() => chain().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        isActive={state.italic}
        onClick={() => chain().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
      <ToolbarButton
        label="Heading"
        isActive={state.h2}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="Subheading"
        isActive={state.h3}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
      <ToolbarButton
        label="Bullet list"
        isActive={state.bullet}
        onClick={() => chain().toggleBulletList().run()}
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        isActive={state.ordered}
        onClick={() => chain().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        label="Checklist"
        isActive={state.task}
        onClick={() => chain().toggleTaskList().run()}
      >
        ☑
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        isActive={state.code}
        onClick={() => chain().toggleCode().run()}
      >
        {"</>"}
      </ToolbarButton>
    </div>
  );
}

/**
 * Tiptap description with autosave: saves 1.2 s after the last keystroke, on blur, and when the
 * panel closes. The editor owns its content after mount; refetches do not overwrite it.
 */
function DescriptionEditor({
  taskId,
  listId,
  initialContent,
}: {
  taskId: string;
  listId: string;
  initialContent: JSONContent | null;
}) {
  const { mutate: save } = useTaskDetailMutation(
    taskId,
    listId,
    (description: JSONContent | null) =>
      updateDescriptionAction(taskId, description, listId),
  );
  const pending = useRef<{ doc: JSONContent | null } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(JSON.stringify(initialContent));
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!pending.current) return;
    const { doc } = pending.current;
    pending.current = null;
    const serialized = JSON.stringify(doc);
    if (serialized === lastSaved.current) return;
    lastSaved.current = serialized;
    saveRef.current(doc);
  };
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({
        placeholder: "Add a description, or type to write notes…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class: "task-description min-h-32 px-3 py-2.5 outline-none",
        "aria-label": "Task description",
      },
    },
    onUpdate: ({ editor: e }) => {
      pending.current = { doc: e.isEmpty ? null : e.getJSON() };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => flushRef.current(), SAVE_DELAY_MS);
    },
    onBlur: () => flushRef.current(),
  });

  // Save what is left when the panel closes or switches task.
  useEffect(() => () => flushRef.current(), []);

  return (
    <div className="rounded-lg border border-neutral-200 transition focus-within:border-violet-400 dark:border-neutral-700 dark:focus-within:border-violet-500">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

export default DescriptionEditor;
