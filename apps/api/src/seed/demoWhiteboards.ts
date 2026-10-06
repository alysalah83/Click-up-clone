import { randomUUID } from "node:crypto";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * Demo whiteboards, stored as Excalidraw element skeletons (`convertToExcalidrawElements`
 * input). The web converts them to full elements the first time the board opens and saves
 * them back, so the seed stays small and readable.
 */

type Skeleton = Record<string, unknown>;

const COLORS = {
  yellow: { bg: "#ffec99", stroke: "#f08c00" },
  pink: { bg: "#ffc9c9", stroke: "#e03131" },
  violet: { bg: "#d0bfff", stroke: "#6741d9" },
  blue: { bg: "#a5d8ff", stroke: "#1971c2" },
  green: { bg: "#b2f2bb", stroke: "#2f9e44" },
} as const;
type Color = keyof typeof COLORS;

const NOTE = { width: 180, height: 120 };
const COLUMN = { width: 420, height: 540, gap: 60 };
/** Note slots inside a column: two per row. */
const slot = (i: number) => ({ x: 20 + (i % 2) * 200, y: 80 + Math.floor(i / 2) * 140 });

interface DemoNote {
  text: string;
  color: Color;
  /** Converted notes link to an existing demo task: [list key, task key]. */
  task?: [list: string, task: string];
}

interface DemoBoard {
  space: string;
  title: string;
  ideas: DemoNote[];
  next: DemoNote[];
  converted: DemoNote[];
  /** Arrows between notes, by [column index, note index]. */
  arrows: [from: [number, number], to: [number, number]][];
}

const DEMO_BOARDS: DemoBoard[] = [
  {
    space: "product",
    title: "Q4 Product Brainstorm",
    ideas: [
      { text: "Template gallery for new spaces", color: "pink" },
      { text: "Slack alerts when a task is due tomorrow", color: "blue" },
      { text: "Dark mode for the mobile app", color: "yellow" },
      { text: "AI summary of long comment threads", color: "violet" },
      { text: "View-only links for clients", color: "blue" },
    ],
    next: [
      { text: "Weekly digest email for managers", color: "violet" },
      { text: "Drag tasks between lists", color: "pink" },
      { text: "Gantt chart export to PDF", color: "yellow" },
    ],
    converted: [
      { text: "Export tasks to CSV", color: "green", task: ["sprint", "sprint.csv-export"] },
      { text: "Keyboard shortcuts cheat sheet", color: "green", task: ["sprint", "sprint.shortcuts-sheet"] },
    ],
    arrows: [
      [[0, 1], [1, 0]],
      [[0, 3], [1, 2]],
      [[1, 1], [2, 0]],
    ],
  },
  {
    space: "marketing",
    title: "Q4 Launch Brainstorm",
    ideas: [
      { text: "Customer story video series", color: "pink" },
      { text: "Partner webinar with Northwind", color: "blue" },
      { text: "Referral program: 1 month free", color: "yellow" },
      { text: "Product Hunt launch day", color: "violet" },
      { text: "Holiday-themed templates", color: "yellow" },
    ],
    next: [
      { text: "Launch email to all trial users", color: "violet" },
      { text: "Paid social A/B test", color: "pink" },
      { text: "Press release draft", color: "blue" },
    ],
    converted: [
      { text: "LinkedIn carousel: 5 dashboard templates", color: "green", task: ["content", "content.carousel"] },
      { text: "Order launch swag", color: "green", task: ["launch", "launch.swag"] },
    ],
    arrows: [
      [[0, 1], [1, 0]],
      [[0, 3], [1, 2]],
      [[1, 1], [2, 0]],
    ],
  },
];

const COLUMNS = [
  { name: "Ideas", bg: "#fff9db" },
  { name: "Next up", bg: "#e7f5ff" },
  { name: "Converted to tasks", bg: "#ebfbee" },
];

/** The task panel deep link, the same one the web opens for a task. */
export const taskHref = (listId: string, taskId: string) => `/home/lists/${listId}/board?task=${taskId}`;

/** Skeleton elements of one board. Ids only need to be unique within the scene. */
export function buildBoardSkeleton(board: DemoBoard, idsByKey: Map<string, string>): Skeleton[] {
  const elements: Skeleton[] = [
    {
      type: "text",
      id: "title",
      x: 0,
      y: -120,
      text: board.title,
      fontSize: 36,
      strokeColor: "#1e1e1e",
    },
    {
      type: "text",
      id: "hint",
      x: 2,
      y: -68,
      text: "Select a sticky note, then click “Convert to task” to send it to a list.",
      fontSize: 16,
      strokeColor: "#868e96",
    },
  ];
  const columns = [board.ideas, board.next, board.converted];
  const noteId = (column: number, index: number) => `note-${column}-${index}`;
  const noteBox = (column: number, index: number) => {
    const { x, y } = slot(index);
    return { x: column * (COLUMN.width + COLUMN.gap) + x, y };
  };

  columns.forEach((notes, column) => {
    const left = column * (COLUMN.width + COLUMN.gap);
    elements.push(
      {
        type: "rectangle",
        id: `column-${column}-bg`,
        x: left,
        y: 0,
        width: COLUMN.width,
        height: COLUMN.height,
        backgroundColor: COLUMNS[column]!.bg,
        strokeColor: "transparent",
        fillStyle: "solid",
        roughness: 0,
        roundness: { type: 3 },
        locked: true,
      },
      {
        type: "text",
        id: `column-${column}-header`,
        x: left + 20,
        y: 24,
        text: COLUMNS[column]!.name,
        fontSize: 24,
        strokeColor: "#343a40",
        locked: true,
      },
    );
    notes.forEach((note, index) => {
      const id = noteId(column, index);
      const listId = note.task && idsByKey.get(note.task[0]);
      const taskId = note.task && idsByKey.get(note.task[1]);
      elements.push({
        type: "rectangle",
        id,
        ...noteBox(column, index),
        ...NOTE,
        backgroundColor: COLORS[note.color].bg,
        strokeColor: COLORS[note.color].stroke,
        fillStyle: "solid",
        strokeWidth: 1,
        roughness: 0,
        roundness: { type: 3 },
        label: { text: note.text, fontSize: 18 },
        ...(listId && taskId ? { link: taskHref(listId, taskId), customData: { taskId } } : {}),
      });
    });
  });

  board.arrows.forEach(([[fromColumn, fromIndex], [toColumn, toIndex]], i) => {
    const from = noteBox(fromColumn, fromIndex);
    const to = noteBox(toColumn, toIndex);
    const start = { x: from.x + NOTE.width + 8, y: from.y + NOTE.height / 2 };
    const end = { x: to.x - 8, y: to.y + NOTE.height / 2 };
    elements.push({
      type: "arrow",
      id: `arrow-${i}`,
      x: start.x,
      y: start.y,
      width: end.x - start.x,
      height: end.y - start.y,
      points: [
        [0, 0],
        [end.x - start.x, end.y - start.y],
      ],
      strokeColor: "#495057",
      strokeWidth: 2,
      roughness: 0,
      start: { id: noteId(fromColumn, fromIndex) },
      end: { id: noteId(toColumn, toIndex) },
    });
  });
  return elements;
}

/** One brainstorm board per demo space. Keys match the demo template. */
export function buildDemoWhiteboards(ownerUserId: string, seed: Pick<DemoRows, "idsByKey">) {
  const now = Date.now();
  return DEMO_BOARDS.flatMap((board, index) => {
    const workspaceId = seed.idsByKey.get(board.space);
    if (!workspaceId) return [];
    const at = new Date(now - (DEMO_BOARDS.length - index) * 60_000);
    return [
      {
        id: randomUUID(),
        workspaceId,
        title: board.title,
        scene: JSON.stringify({ skeleton: true, elements: buildBoardSkeleton(board, seed.idsByKey) }),
        createdById: ownerUserId,
        createdAt: at,
        updatedAt: at,
      },
    ];
  });
}
