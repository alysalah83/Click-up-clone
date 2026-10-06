import { describe, expect, it } from "vitest";
import {
  boardTitle,
  findStickyNote,
  markConverted,
  noteTaskName,
  parseScene,
  sceneVersion,
  serializeScene,
  type SceneElement,
} from "./lib";

const el = (id: string, type: string, extra: Partial<SceneElement> = {}): SceneElement => ({
  id,
  type,
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  version: 1,
  ...extra,
});

const shape = el("shape", "rectangle", { boundElements: [{ id: "label", type: "text" }] });
const label = el("label", "text", { containerId: "shape", text: "Dark\nmode", originalText: "Dark mode  for mobile" });
const loose = el("loose", "text", { text: "Loose idea" });
const arrow = el("arrow", "arrow");
const elements = [shape, label, loose, arrow];

describe("whiteboard lib", () => {
  it("parses empty, skeleton and saved scenes, and survives bad JSON", () => {
    expect(parseScene("")).toEqual({ kind: "empty" });
    expect(parseScene("{nope")).toEqual({ kind: "empty" });
    expect(parseScene(JSON.stringify({ skeleton: true, elements: [{ type: "text" }] }))).toEqual({
      kind: "skeleton",
      elements: [{ type: "text" }],
    });
    expect(parseScene(JSON.stringify({ elements: [] }))).toEqual({ kind: "scene", elements: [], appState: {}, files: {} });
  });

  it("serializes live elements and only the files they use", () => {
    const image = el("img", "image", { fileId: "f1" });
    const gone = el("gone", "image", { fileId: "f2", isDeleted: true });
    const out = JSON.parse(
      serializeScene([image, gone], { viewBackgroundColor: "#fff" }, { f1: { id: "f1" }, f2: { id: "f2" } }),
    );
    expect(out.elements.map((e: SceneElement) => e.id)).toEqual(["img"]);
    expect(Object.keys(out.files)).toEqual(["f1"]);
    expect(out.appState).toEqual({ viewBackgroundColor: "#fff" });
  });

  it("changes the version when elements change", () => {
    expect(sceneVersion([shape])).not.toBe(sceneVersion([{ ...shape, version: 2 }]));
    expect(sceneVersion([shape])).not.toBe(sceneVersion([shape, loose]));
  });

  it("finds the note behind a shape, its label, both, or a standalone text", () => {
    expect(findStickyNote(elements, { shape: true })?.target.id).toBe("shape");
    expect(findStickyNote(elements, { label: true })?.text).toBe("Dark mode for mobile");
    expect(findStickyNote(elements, { shape: true, label: true })?.target.id).toBe("shape");
    expect(findStickyNote(elements, { loose: true })?.text).toBe("Loose idea");
  });

  it("ignores arrows, empty shapes and multi-note selections", () => {
    expect(findStickyNote(elements, {})).toBeNull();
    expect(findStickyNote(elements, { arrow: true })).toBeNull();
    expect(findStickyNote(elements, { shape: true, loose: true })).toBeNull();
    expect(findStickyNote([el("bare", "rectangle")], { bare: true })).toBeNull();
  });

  it("marks a note converted with a task link, and reads the task back", () => {
    const converted = markConverted(shape, "/home/lists/l1/board?task=t1", "t1");
    expect(converted).toMatchObject({ link: "/home/lists/l1/board?task=t1", backgroundColor: "#b2f2bb", version: 2 });
    expect(findStickyNote([converted, label], { shape: true })?.taskId).toBe("t1");
    const linkedOnly = { ...shape, link: "/home/lists/l1/board?task=t9" };
    expect(findStickyNote([linkedOnly, label], { shape: true })?.taskId).toBe("t9");
  });

  it("formats names and titles", () => {
    expect(noteTaskName("  a\n\nb  ")).toBe("a b");
    expect(noteTaskName("x".repeat(200))).toHaveLength(128);
    expect(boardTitle({ title: " " })).toBe("Untitled whiteboard");
  });
});
