"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToolbarButton } from "@/features/taskDetail/components/DescriptionEditor";
import { useDeleteDoc, useDoc, useUpdateDoc } from "../hooks/useDocs";
import { parseContent } from "../lib";
import type { Doc, DocPatch } from "../types";

const SAVE_DELAY_MS = 800;
const EMOJIS = ["📄", "📝", "🗺️", "🚀", "💡", "🎨", "📊", "✅", "📚", "🔁", "👋", "🎯"];

type SaveState = "idle" | "saving" | "saved" | "error";

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      code: e.isActive("code"),
      block: e.isActive("codeBlock"),
      quote: e.isActive("blockquote"),
    }),
  });
  const chain = () => editor.chain().focus();
  const divider = <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600" />;
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-lg border border-neutral-200 bg-background/95 px-1.5 py-1 backdrop-blur dark:border-neutral-700"
    >
      <ToolbarButton label="Bold" isActive={s.bold} onClick={() => chain().toggleBold().run()}>B</ToolbarButton>
      <ToolbarButton label="Italic" isActive={s.italic} onClick={() => chain().toggleItalic().run()}>
        <span className="italic">I</span>
      </ToolbarButton>
      {divider}
      <ToolbarButton label="Heading 1" isActive={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>H1</ToolbarButton>
      <ToolbarButton label="Heading 2" isActive={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <ToolbarButton label="Heading 3" isActive={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
      {divider}
      <ToolbarButton label="Bullet list" isActive={s.bullet} onClick={() => chain().toggleBulletList().run()}>•≡</ToolbarButton>
      <ToolbarButton label="Numbered list" isActive={s.ordered} onClick={() => chain().toggleOrderedList().run()}>1.</ToolbarButton>
      <ToolbarButton label="Task list" isActive={s.task} onClick={() => chain().toggleTaskList().run()}>☑</ToolbarButton>
      {divider}
      <ToolbarButton label="Quote" isActive={s.quote} onClick={() => chain().toggleBlockquote().run()}>&rdquo;</ToolbarButton>
      <ToolbarButton label="Inline code" isActive={s.code} onClick={() => chain().toggleCode().run()}>{"</>"}</ToolbarButton>
      <ToolbarButton label="Code block" isActive={s.block} onClick={() => chain().toggleCodeBlock().run()}>{"{ }"}</ToolbarButton>
    </div>
  );
}

function SavedIndicator({ state }: { state: SaveState }) {
  const text = { idle: "", saving: "Saving…", saved: "Saved", error: "Not saved" }[state];
  return (
    <span
      role="status"
      aria-live="polite"
      className={`text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}
    >
      {text}
    </span>
  );
}

/** Title, icon and Tiptap body of one doc. Keyed by doc id, so it owns its state after mount. */
function DocForm({ doc }: { doc: Doc }) {
  const router = useRouter();
  const { mutateAsync: update } = useUpdateDoc();
  const { mutateAsync: remove, isPending: isDeleting } = useDeleteDoc();
  const [title, setTitle] = useState(doc.title);
  const [icon, setIcon] = useState(doc.icon);
  const [state, setState] = useState<SaveState>("idle");

  const pending = useRef<DocPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  }, [update]);
  const mounted = useRef(true);

  const flush = async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    if (Object.keys(patch).length === 0) return;
    pending.current = {};
    if (mounted.current) setState("saving");
    try {
      await updateRef.current({ id: doc.id, patch });
      if (mounted.current) setState((s) => (Object.keys(pending.current).length ? s : "saved"));
    } catch {
      // Keep the edits for the next attempt, unless newer ones replaced them.
      pending.current = { ...patch, ...pending.current };
      if (mounted.current) setState("error");
    }
  };
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  const queue = (patch: DocPatch) => {
    pending.current = { ...pending.current, ...patch };
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), SAVE_DELAY_MS);
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: parseContent(doc.content),
    editorProps: {
      attributes: { class: "task-description doc-body min-h-[50vh] py-3 outline-none", "aria-label": "Doc content" },
    },
    onUpdate: ({ editor: e }) => queue({ content: e.isEmpty ? "" : JSON.stringify(e.getJSON()) }),
    onBlur: () => void flushRef.current(),
  });

  useEffect(() => {
    mounted.current = true;
    const save = () => void flushRef.current();
    window.addEventListener("pagehide", save);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", save);
      void flushRef.current();
    };
  }, []);

  const onDelete = async () => {
    if (!window.confirm("Delete this doc and its sub-pages?")) return;
    pending.current = {};
    if (timer.current) clearTimeout(timer.current);
    try {
      await remove(doc.id);
      router.push("/home/docs");
    } catch {
      toast.error("Could not delete the doc");
    }
  };

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-5 sm:px-8 sm:py-8">
      <div className="flex items-center justify-between gap-2">
        <Link href="/home/docs" className="text-xs text-muted-foreground hover:underline">
          All docs
        </Link>
        <div className="flex items-center gap-2">
          <SavedIndicator state={state} />
          <Button variant="ghost" size="icon" aria-label="Delete doc" disabled={isDeleting} onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Change icon"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-2xl hover:bg-neutral-500/15"
            >
              {icon ?? "📄"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="grid w-56 grid-cols-6 gap-1 p-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`Use ${emoji}`}
                onClick={() => {
                  setIcon(emoji);
                  queue({ icon: emoji });
                }}
                className="flex size-8 cursor-pointer items-center justify-center rounded text-lg hover:bg-neutral-500/15"
              >
                {emoji}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <input
          value={title}
          maxLength={200}
          onChange={(e) => {
            setTitle(e.target.value);
            queue({ title: e.target.value });
          }}
          onBlur={() => void flush()}
          placeholder="Untitled"
          aria-label="Doc title"
          className="min-w-0 flex-1 bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-neutral-400 sm:text-3xl"
        />
      </div>

      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </article>
  );
}

function DocEditor({ docId }: { docId: string }) {
  const { data: doc, isPending, error } = useDoc(docId);

  if (isPending)
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8" aria-busy="true">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (error || !doc)
    return (
      <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
        <p>This doc does not exist or you no longer have access to it.</p>
        <Link href="/home/docs" className="text-violet-600 hover:underline dark:text-violet-300">
          Back to docs
        </Link>
      </div>
    );
  return <DocForm key={doc.id} doc={doc} />;
}

export default DocEditor;
