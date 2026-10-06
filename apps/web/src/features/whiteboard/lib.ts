/**
 * Pure helpers for whiteboard scenes. No Excalidraw import here, so pages other than the
 * board page never load the editor bundle.
 */

/** The few element fields these helpers read. Excalidraw elements are structurally compatible. */
export type SceneElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  version: number;
  isDeleted?: boolean;
  containerId?: string | null;
  boundElements?: readonly { id: string; type: string }[] | null;
  text?: string;
  originalText?: string;
  link?: string | null;
  customData?: Record<string, unknown>;
  fileId?: string | null;
};

export type ParsedScene =
  | { kind: "empty" }
  /** Seeded boards: `convertToExcalidrawElements` input, converted on first open. */
  | { kind: "skeleton"; elements: unknown[] }
  | { kind: "scene"; elements: unknown[]; appState: Record<string, unknown>; files: Record<string, unknown> };

export const boardTitle = (board: { title: string }) => board.title.trim() || "Untitled whiteboard";

export function parseScene(scene: string): ParsedScene {
  if (!scene) return { kind: "empty" };
  try {
    const parsed = JSON.parse(scene) as {
      skeleton?: boolean;
      elements?: unknown;
      appState?: Record<string, unknown>;
      files?: Record<string, unknown>;
    };
    const elements = Array.isArray(parsed.elements) ? parsed.elements : [];
    if (parsed.skeleton) return { kind: "skeleton", elements };
    return { kind: "scene", elements, appState: parsed.appState ?? {}, files: parsed.files ?? {} };
  } catch {
    return { kind: "empty" };
  }
}

/** Live elements, the background color, and only the image files those elements still use. */
export function serializeScene(
  elements: readonly SceneElement[],
  appState: { viewBackgroundColor?: string },
  files: Record<string, unknown>,
) {
  const live = elements.filter((e) => !e.isDeleted);
  const used = new Set(live.flatMap((e) => (e.fileId ? [e.fileId] : [])));
  return JSON.stringify({
    elements: live,
    appState: { viewBackgroundColor: appState.viewBackgroundColor },
    files: Object.fromEntries(Object.entries(files).filter(([id]) => used.has(id))),
  });
}

/** Changes whenever an element is added, edited or deleted (Excalidraw bumps `version`). */
export const sceneVersion = (elements: readonly SceneElement[]) =>
  elements.reduce((sum, e) => sum + e.version, 0) + elements.length;

const CONTAINERS = new Set(["rectangle", "ellipse", "diamond"]);

export type StickyNote = {
  /** The element that carries the link and color: the shape, or a standalone text. */
  target: SceneElement;
  text: string;
  /** Task id when the note was already converted. */
  taskId: string | null;
};

/** One-line task name from note text: whitespace collapsed, capped at the task name limit. */
export const noteTaskName = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 128);

const taskIdOf = (element: SceneElement): string | null => {
  const fromData = element.customData?.taskId;
  if (typeof fromData === "string") return fromData;
  return element.link?.match(/[?&]task=([^&#]+)/)?.[1] ?? null;
};

/**
 * The sticky note behind a selection: a shape with bound text, or a standalone text element.
 * Selecting the shape, its text, or both counts; anything else (several notes, an arrow) is null.
 */
export function findStickyNote(
  elements: readonly SceneElement[],
  selectedIds: Readonly<Record<string, boolean>>,
): StickyNote | null {
  const byId = new Map(elements.filter((e) => !e.isDeleted).map((e) => [e.id, e]));
  const selected = Object.keys(selectedIds)
    .filter((id) => selectedIds[id])
    .map((id) => byId.get(id))
    .filter((e): e is SceneElement => !!e);
  if (selected.length === 0 || selected.length > 2) return null;

  // Resolve every selected element to its note shape (a bound text resolves to its container).
  const roots = new Set(
    selected.map((e) => (e.type === "text" && e.containerId && byId.has(e.containerId) ? e.containerId : e.id)),
  );
  if (roots.size !== 1) return null;
  const target = byId.get([...roots][0]!)!;

  let textElement: SceneElement | undefined;
  if (target.type === "text") textElement = target;
  else if (CONTAINERS.has(target.type)) {
    const bound = target.boundElements?.find((b) => b.type === "text");
    textElement = bound ? byId.get(bound.id) : undefined;
  }
  if (!textElement) return null;
  const text = noteTaskName(textElement.originalText ?? textElement.text ?? "");
  if (!text) return null;
  return { target, text, taskId: taskIdOf(target) };
}

export const CONVERTED_COLORS = { background: "#b2f2bb", stroke: "#2f9e44" };

/**
 * The note's element after conversion: linked to the task (clicking the link opens the task
 * panel) and tinted green. Version bumps make Excalidraw and the autosave pick it up.
 */
export function markConverted<T extends SceneElement>(element: T, href: string, taskId: string): T {
  const tint =
    element.type === "text"
      ? { strokeColor: CONVERTED_COLORS.stroke }
      : { backgroundColor: CONVERTED_COLORS.background, strokeColor: CONVERTED_COLORS.stroke, fillStyle: "solid" };
  return {
    ...element,
    ...tint,
    link: href,
    customData: { ...element.customData, taskId },
    version: element.version + 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    updated: Date.now(),
  };
}

export const taskHref = (listId: string, taskId: string) => `/home/lists/${listId}/board?task=${taskId}`;
