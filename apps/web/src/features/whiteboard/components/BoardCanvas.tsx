"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  ExcalidrawTextElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import MiniSpinner from "@/shared/ui/MiniSpinner";
import { useCreateTaskFromNote, useUpdateWhiteboard } from "../hooks/useWhiteboards";
import {
  findStickyNote,
  markConverted,
  parseScene,
  sceneVersion,
  serializeScene,
  taskHref,
  type SceneElement,
} from "../lib";
import type { Whiteboard } from "../types";
import ConvertNoteButton from "./ConvertNoteButton";

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(() => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <MiniSpinner bgColor="bg-neutral-900 dark:bg-neutral-200" width="large" padding="p-1.5" />
    </div>
  ),
});

const SAVE_DELAY_MS = 1000;
/** Excalidraw's padding between a sticky note's edge and its bound text. */
const BOUND_TEXT_PADDING = 5;

/**
 * Text is measured with a fallback font until Excalidraw's hand-drawn fonts arrive (from a CDN),
 * so seeded notes come out too narrow and clip ("Template gallery fo"). Once the scene's fonts
 * are loaded, re-wrap every text from its original text and refit it to its note (growing the
 * note if it needs more lines). Changed elements get a new version, so the fix is saved.
 */
async function refreshTextAfterFonts(api: ExcalidrawImperativeAPI) {
  const { FONT_FAMILY, restoreElements, newElementWith, CaptureUpdateAction } = await import(
    "@excalidraw/excalidraw"
  );
  const familyName = new Map<number, string>(Object.entries(FONT_FAMILY).map(([name, id]) => [id, name]));
  const texts = (api.getSceneElements() as readonly ExcalidrawElement[]).filter((e): e is ExcalidrawTextElement => e.type === "text");
  if (texts.length === 0) return false;
  const chars = Array.from(new Set(texts.map((t) => t.originalText).join(""))).join("");
  const families = new Set(texts.map((t) => familyName.get(t.fontFamily)).filter(Boolean));
  try {
    await Promise.all([...families].map((name) => document.fonts.load(`20px "${name}"`, chars)));
    await document.fonts.ready;
  } catch {
    return false;
  }
  // Let Excalidraw's own font-loaded handler clear its measurement caches first.
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const current = api.getSceneElementsIncludingDeleted();
  const byId = new Map(current.map((e) => [e.id, e]));
  const restored = restoreElements(
    current.map((e) => (e.type === "text" && !e.isDeleted ? { ...e, text: e.originalText } : e)),
    null,
    { refreshDimensions: true, repairBindings: true },
  );
  const updates = new Map<string, Partial<ExcalidrawElement>>();
  const near = (a: number, b: number) => Math.abs(a - b) < 0.5;
  for (const r of restored) {
    const el = byId.get(r.id);
    if (!el || el.isDeleted || el.type !== "text" || r.type !== "text") continue;
    let { x, y } = r;
    const { width, height, text } = r;
    const container = el.containerId ? byId.get(el.containerId) : undefined;
    if (container && container.type === "rectangle") {
      const needed = height + BOUND_TEXT_PADDING * 2;
      const containerHeight = Math.max(container.height, needed);
      if (containerHeight !== container.height) updates.set(container.id, { height: containerHeight });
      const innerW = container.width - BOUND_TEXT_PADDING * 2;
      const innerH = containerHeight - BOUND_TEXT_PADDING * 2;
      const left = container.x + BOUND_TEXT_PADDING;
      const top = container.y + BOUND_TEXT_PADDING;
      x = el.textAlign === "left" ? left : el.textAlign === "right" ? left + innerW - width : left + (innerW - width) / 2;
      y = el.verticalAlign === "top" ? top : el.verticalAlign === "bottom" ? top + innerH - height : top + (innerH - height) / 2;
    }
    if (text === el.text && near(width, el.width) && near(height, el.height) && near(x, el.x) && near(y, el.y)) continue;
    updates.set(el.id, { text, width, height, x, y });
  }
  if (updates.size === 0) return false;
  api.updateScene({
    elements: current.map((e) => {
      const patch = updates.get(e.id);
      return patch ? newElementWith(e, patch as never) : e;
    }),
    captureUpdate: CaptureUpdateAction.NEVER,
  });
  return true;
}

export type SaveState = "idle" | "saving" | "saved" | "error";

type NoteUi = { targetId: string; text: string; taskLink: string | null; left: number; top: number };

/** Same-app links (the task panel) navigate in place; anything else opens like a normal link. */
function internalPath(link: string) {
  try {
    const url = new URL(link, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}

/**
 * The Excalidraw canvas of one board, keyed by board id: it owns the scene after mount.
 * Seeded boards arrive as element skeletons and are converted (then saved back) on first open.
 * Edits autosave after a short pause, and on leave.
 */
function BoardCanvas({ board, onSaveState }: { board: Whiteboard; onSaveState: (state: SaveState) => void }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { mutateAsync: update } = useUpdateWhiteboard();
  const convert = useCreateTaskFromNote(board.id);
  const [note, setNote] = useState<NoteUi | null>(null);

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const latest = useRef<{ elements: readonly ExcalidrawElement[]; appState: AppState; files: BinaryFiles } | null>(
    null,
  );
  /** Elements the stored scene starts with; changes are ignored until the canvas shows them. */
  const loaded = useRef<{ count: number; convertedFromSkeleton: boolean } | null>(null);
  const savedVersion = useRef<number | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteKey = useRef("");
  const onSaveStateRef = useRef(onSaveState);
  const updateRef = useRef(update);
  useEffect(() => {
    onSaveStateRef.current = onSaveState;
    updateRef.current = update;
  });

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const snapshot = latest.current;
    if (!dirty.current || !snapshot) return;
    dirty.current = false;
    const scene = serializeScene(
      snapshot.elements as unknown as SceneElement[],
      snapshot.appState,
      snapshot.files as Record<string, unknown>,
    );
    onSaveStateRef.current("saving");
    try {
      await updateRef.current({ id: board.id, patch: { scene } });
      if (!dirty.current) onSaveStateRef.current("saved");
    } catch {
      dirty.current = true; // retried with the next change or on leave
      onSaveStateRef.current("error");
    }
  }, [board.id]);

  const queueSave = useCallback(() => {
    dirty.current = true;
    onSaveStateRef.current("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
  }, [flush]);

  useEffect(() => {
    const save = () => void flush();
    window.addEventListener("pagehide", save);
    return () => {
      window.removeEventListener("pagehide", save);
      void flush();
    };
  }, [flush]);

  const [initialData] = useState(() => async (): Promise<ExcalidrawInitialDataState> => {
    const parsed = parseScene(board.scene);
    if (parsed.kind === "skeleton") {
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const elements = convertToExcalidrawElements(parsed.elements as ExcalidrawElementSkeleton[], {
        regenerateIds: false,
      });
      loaded.current = { count: elements.length, convertedFromSkeleton: true };
      return { elements, scrollToContent: true };
    }
    if (parsed.kind === "scene") {
      loaded.current = { count: parsed.elements.length, convertedFromSkeleton: false };
      return {
        elements: parsed.elements as ExcalidrawElement[],
        appState: parsed.appState as Partial<AppState>,
        files: parsed.files as BinaryFiles,
        scrollToContent: true,
      };
    }
    loaded.current = { count: 0, convertedFromSkeleton: false };
    return { elements: [] };
  });

  const updateNote = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    const busy =
      appState.selectedElementsAreBeingDragged ||
      appState.isResizing ||
      appState.isRotating ||
      !!appState.newElement ||
      !!appState.editingTextElement;
    const found = busy ? null : findStickyNote(elements as unknown as SceneElement[], appState.selectedElementIds);
    let next: NoteUi | null = null;
    if (found) {
      const { target } = found;
      const zoom = appState.zoom.value;
      next = {
        targetId: target.id,
        text: found.text,
        taskLink: found.taskId ? (target.link ?? null) : null,
        left: Math.round((target.x + target.width / 2 + appState.scrollX) * zoom),
        top: Math.round((target.y + target.height + appState.scrollY) * zoom + 14),
      };
    }
    const key = next ? JSON.stringify(next) : "";
    if (key === noteKey.current) return;
    noteKey.current = key;
    setNote(next);
  }, []);

  const onChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      latest.current = { elements, appState, files };
      updateNote(elements, appState);
      const start = loaded.current;
      if (!start) return;
      const version = sceneVersion(elements as unknown as SceneElement[]);
      if (savedVersion.current === null) {
        // Wait until the stored scene is on the canvas, so an early empty change never saves.
        if (start.count > 0 && elements.length === 0) return;
        savedVersion.current = version;
        if (start.count > 0) {
          const fit = () =>
            apiRef.current?.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.9, maxZoom: 1 });
          requestAnimationFrame(fit);
          const api = apiRef.current;
          if (api)
            void refreshTextAfterFonts(api).then((changed) => {
              if (changed && start.convertedFromSkeleton) fit();
            });
        }
        if (start.convertedFromSkeleton) queueSave();
        return;
      }
      if (version === savedVersion.current) return;
      savedVersion.current = version;
      queueSave();
    },
    [queueSave, updateNote],
  );

  const onLinkOpen = useCallback(
    (element: NonDeletedExcalidrawElement, event: CustomEvent<{ nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement> }>) => {
      const path = element.link ? internalPath(element.link) : null;
      if (!path) return;
      event.preventDefault();
      void flush();
      router.push(path);
    },
    [flush, router],
  );

  const setApi = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
  }, []);

  const openTask = (href: string) => {
    void flush();
    router.push(href);
  };

  const onConvert = async (listId: string) => {
    const current = note;
    const api = apiRef.current;
    if (!current || !api) return;
    try {
      const task = await convert.mutateAsync({ listId, name: current.text });
      const href = taskHref(task.listId, task.id);
      api.updateScene({
        elements: api
          .getSceneElementsIncludingDeleted()
          .map((e) => (e.id === current.targetId ? markConverted(e as unknown as SceneElement, href, task.id) : e)) as ExcalidrawElement[],
        captureUpdate: "IMMEDIATELY",
      });
      toast.success("Task created", {
        description: task.name,
        action: { label: "Open task", onClick: () => openTask(href) },
      });
    } catch {
      toast.error("Could not create the task");
    }
  };

  return (
    <div className="relative h-full w-full">
      <Excalidraw
        excalidrawAPI={setApi}
        initialData={initialData}
        onChange={onChange}
        onLinkOpen={onLinkOpen}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        name={board.title}
      />
      {note && (
        <ConvertNoteButton
          key={note.targetId}
          workspaceId={board.workspaceId}
          text={note.text}
          taskLink={note.taskLink}
          position={{ left: note.left, top: note.top }}
          isPending={convert.isPending}
          onConvert={onConvert}
          onOpenTask={openTask}
        />
      )}
    </div>
  );
}

export default BoardCanvas;
