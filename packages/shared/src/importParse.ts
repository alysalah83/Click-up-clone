/**
 * CSV / Trello import: parsing and normalization into one import model, shared by the web app
 * (parsed in the browser for the preview) and the API (the payload schema in `import.ts` mirrors
 * `ImportPayload`). This file has no imports, so the web imports it directly by path.
 */

export const MAX_IMPORT_TASKS = 1000;
export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_DESCRIPTION = 5000;

export type ImportSource = "csv" | "trello";
export type ImportPriority = "urgent" | "high" | "normal" | "low" | "none";
export type ImportStatusType = "open" | "active" | "done";

export interface ImportStatus {
  name: string;
  type: ImportStatusType;
  /** A status color token of the web's ColorPicker (e.g. "violet"). */
  color: string;
}
export interface ImportTag {
  name: string;
  /** Hex color. */
  color: string;
}
export interface ImportChecklist {
  name: string;
  items: { text: string; done: boolean }[];
}
export interface ImportTask {
  name: string;
  /** Plain text; the API turns it into a rich-text document. */
  description: string | null;
  /** Name of one of the payload's statuses. */
  status: string;
  priority: ImportPriority;
  /** ISO timestamps. */
  startDate: string | null;
  dueDate: string | null;
  /** Names or emails, matched against the space's members (unknown ones are ignored). */
  assignees: string[];
  /** Names of the payload's tags. */
  tags: string[];
  points: number | null;
  checklists: ImportChecklist[];
}
export interface ImportWarning {
  /** 1-based data row (CSV) or card name (Trello), when the warning is about one item. */
  where?: string;
  message: string;
}
export interface ImportModel {
  source: ImportSource;
  listName: string;
  statuses: ImportStatus[];
  tags: ImportTag[];
  tasks: ImportTask[];
  warnings: ImportWarning[];
}
/** What the web sends to POST /imports. */
export type ImportPayload = Omit<ImportModel, "warnings"> & { workspaceId: string };

const clip = (value: string, max: number) => {
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max).trim() : trimmed;
};
const clipName = (value: string) => clip(value.replace(/\s+/g, " "), 128);
const tagName = (value: string) => clip(value.toLowerCase().replace(/\s+/g, " "), 32);

// ---------------------------------------------------------------------------------------------
// CSV (RFC 4180)

/** The delimiter of the first line (outside quotes) that occurs most: comma, semicolon or tab. */
export function detectCsvDelimiter(text: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === "\n" || ch === "\r")) break;
    else if (!quoted && ch in counts) counts[ch]!++;
  }
  let best = ",";
  for (const d of [";", "\t"]) if (counts[d]! > counts[best]!) best = d;
  return best;
}

/**
 * Parses CSV text into rows of fields: quoted fields, `""` escapes, newlines inside quotes,
 * CRLF / LF / CR line ends and a UTF-8 BOM. Blank lines are skipped. The delimiter is detected
 * when not given.
 */
export function parseCsv(input: string, delimiter?: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const sep = delimiter ?? detectCsvDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endRow = () => {
    row.push(field);
    field = "";
    if (row.length > 1 || row[0]!.trim() !== "") rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else field += ch;
      i++;
      continue;
    }
    if (ch === '"' && field.trim() === "") {
      field = "";
      quoted = true;
    } else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\r" || ch === "\n") {
      endRow();
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else field += ch;
    i++;
  }
  if (field !== "" || row.length > 0) endRow();
  return rows;
}

// ---------------------------------------------------------------------------------------------
// Dates

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function validDay(y: number, m: number, d: number) {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** A date-only value is 12:00 UTC of that calendar day (the app's convention for task dates). */
function build(y: number, m: number, d: number, hh?: string, mm?: string, ampm?: string): Date | null {
  if (y < 100) y += 2000;
  if (!validDay(y, m, d)) return null;
  if (hh === undefined) return new Date(Date.UTC(y, m - 1, d, 12));
  let hour = Number(hh);
  const minute = Number(mm ?? 0);
  if (ampm) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (ampm.toLowerCase() === "pm" ? 12 : 0);
  }
  if (hour > 23 || minute > 59) return null;
  // A time without a zone is the importer's local time.
  return new Date(y, m - 1, d, hour, minute);
}

const TIME = String.raw`(?:[ T](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*([ap]m)?)?`;
const ISO_ZONED = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i;
const YMD = new RegExp(String.raw`^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})${TIME}$`, "i");
const SLASH = new RegExp(String.raw`^(\d{1,2})/(\d{1,2})/(\d{2}|\d{4})${TIME}$`, "i");
const DOTS = new RegExp(String.raw`^(\d{1,2})[.-](\d{1,2})[.-](\d{2}|\d{4})${TIME}$`, "i");
const MONTH_FIRST = new RegExp(String.raw`^([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})${TIME}$`, "i");
const DAY_FIRST = new RegExp(String.raw`^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?,?\s+(\d{4})${TIME}$`, "i");

const monthIndex = (name: string) => {
  const i = MONTHS.indexOf(name.slice(0, 3).toLowerCase());
  return i < 0 ? 0 : i + 1;
};

/**
 * Parses the common date formats of spreadsheet and tool exports: ISO (`2026-10-08`,
 * `2026-10-08T14:00:00Z`), `2026-10-08 14:00`, `MM/DD/YYYY` (read as `DD/MM/YYYY` when the
 * first number is above 12), `DD.MM.YYYY`, `DD-MM-YYYY`, `Oct 8, 2026` and `8 October 2026`,
 * each with an optional `HH:mm` (and am/pm). Returns null for anything else.
 */
export function parseImportDate(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  if (ISO_ZONED.test(v)) {
    const date = new Date(v);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  let m = YMD.exec(v);
  if (m) return build(+m[1]!, +m[2]!, +m[3]!, m[4], m[5], m[6]);
  m = SLASH.exec(v);
  if (m) {
    const [a, b] = [+m[1]!, +m[2]!];
    return a > 12 ? build(+m[3]!, b, a, m[4], m[5], m[6]) : build(+m[3]!, a, b, m[4], m[5], m[6]);
  }
  m = DOTS.exec(v);
  if (m) return build(+m[3]!, +m[2]!, +m[1]!, m[4], m[5], m[6]);
  m = MONTH_FIRST.exec(v);
  if (m && monthIndex(m[1]!)) return build(+m[3]!, monthIndex(m[1]!), +m[2]!, m[4], m[5], m[6]);
  m = DAY_FIRST.exec(v);
  if (m && monthIndex(m[2]!)) return build(+m[3]!, monthIndex(m[2]!), +m[1]!, m[4], m[5], m[6]);
  return null;
}

// ---------------------------------------------------------------------------------------------
// Priority and points

const PRIORITY_WORDS: Record<string, ImportPriority> = {
  urgent: "urgent", critical: "urgent", highest: "urgent", blocker: "urgent", asap: "urgent", "1": "urgent", p0: "urgent", p1: "urgent",
  high: "high", important: "high", "2": "high", p2: "high",
  normal: "normal", medium: "normal", med: "normal", moderate: "normal", "3": "normal", p3: "normal",
  low: "low", lowest: "low", minor: "low", trivial: "low", "4": "low", p4: "low",
  none: "none", "no priority": "none", "-": "none",
};

/** ClickUp priority words (and common synonyms, 1-4, P1-P4); null when unknown, "none" when empty. */
export function parseImportPriority(value: string): ImportPriority | null {
  const v = value.trim().toLowerCase();
  if (!v) return "none";
  return PRIORITY_WORDS[v] ?? null;
}

/** Whole points 0-999 (decimals are rounded); null when empty or not a number. */
export function parseImportPoints(value: string): number | null {
  const n = Number(value.trim().replace(",", "."));
  if (!value.trim() || !Number.isFinite(n) || n < 0) return null;
  return Math.min(999, Math.round(n));
}

/** Splits a multi-value cell ("a, b; c | d") into trimmed, non-empty parts. */
export const splitMulti = (value: string) =>
  value
    .split(/[,;|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

// ---------------------------------------------------------------------------------------------
// Statuses

const DONE_RE = /^(done|complete|completed|closed|finished|resolved|shipped|released|archived|live)$/i;
const OPEN_RE = /^(to ?do|todo|backlog|open|new|not started|planned|ideas?|inbox|icebox)$/i;
const ACTIVE_COLORS = ["violet", "amber", "blue", "teal", "purple", "cyan", "indigo", "lime"];

/**
 * Builds a valid status set from source status names (in source order): exactly one open status
 * (the first "to do"-like name, else the first), one done status (the last "done"-like name; with
 * `lastIsDone`, else the last name; else a "complete" status is added) and at least one active one.
 * `resolve` maps a source name (any case) to its status name.
 */
export function buildImportStatuses(names: string[], { lastIsDone = false } = {}) {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of names) {
    const name = clip(raw.replace(/\s+/g, " "), 64);
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      unique.push(name);
    }
  }
  const has = (name: string) => seen.has(name.toLowerCase());

  let doneIdx = -1;
  for (let i = unique.length - 1; i >= 0 && doneIdx < 0; i--) if (DONE_RE.test(unique[i]!)) doneIdx = i;
  if (doneIdx < 0 && lastIsDone && unique.length >= 2) doneIdx = unique.length - 1;
  const done = doneIdx >= 0 ? unique[doneIdx]! : has("complete") ? "completed" : "complete";
  const rest = unique.filter((_, i) => i !== doneIdx);

  let openIdx = rest.findIndex((n) => OPEN_RE.test(n));
  if (openIdx < 0) openIdx = 0;
  const open = rest[openIdx] ?? (has("to do") ? "todo" : "to do");
  const actives = rest.filter((_, i) => i !== openIdx);
  if (actives.length === 0) actives.push(has("in progress") ? "doing" : "in progress");

  const statuses: ImportStatus[] = [
    { name: open, type: "open", color: "neutral" },
    ...actives.map((name, i) => ({ name, type: "active" as const, color: ACTIVE_COLORS[i % ACTIVE_COLORS.length]! })),
    { name: done, type: "done", color: "emerald" },
  ];
  const byLower = new Map(statuses.map((s) => [s.name.toLowerCase(), s.name]));
  const resolve = (source: string | null | undefined) =>
    byLower.get(clip((source ?? "").replace(/\s+/g, " "), 64).toLowerCase()) ?? open;
  return { statuses, open, done, resolve };
}

// ---------------------------------------------------------------------------------------------
// Tags

const TAG_PALETTE = ["#0c66e4", "#1f845a", "#e17100", "#8f3fd1", "#e5488a", "#0092b8", "#c9372c", "#5b7f24", "#4f39f6"];

/** A stable palette color for a tag name. */
export function tagColorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length]!;
}

/** Trello label colors (with their _light / _dark variants) as hex. */
export const TRELLO_LABEL_COLORS: Record<string, string> = {
  green: "#1f845a",
  yellow: "#b38600",
  orange: "#e17100",
  red: "#c9372c",
  purple: "#8f3fd1",
  blue: "#0c66e4",
  sky: "#0092b8",
  lime: "#5b7f24",
  pink: "#e5488a",
  black: "#44546f",
};

export function trelloColor(color: string | null | undefined) {
  const base = (color ?? "").replace(/_(light|dark)$/, "");
  return TRELLO_LABEL_COLORS[base] ?? "#626f86";
}

// ---------------------------------------------------------------------------------------------
// CSV -> import model

export const CSV_FIELDS = [
  "name",
  "description",
  "status",
  "priority",
  "dueDate",
  "startDate",
  "assignee",
  "tags",
  "points",
  "ignore",
] as const;
export type CsvField = (typeof CSV_FIELDS)[number];

export const CSV_FIELD_LABELS: Record<CsvField, string> = {
  name: "Task name",
  description: "Description",
  status: "Status",
  priority: "Priority",
  dueDate: "Due date",
  startDate: "Start date",
  assignee: "Assignee",
  tags: "Tags",
  points: "Points",
  ignore: "Ignore",
};

const FIELD_HEADERS: [Exclude<CsvField, "ignore">, RegExp][] = [
  ["name", /^(title|name|task|task ?name|summary|card ?name|subject|item)$/],
  ["description", /^(description|desc|details?|notes?|body|content)$/],
  ["status", /^(status|state|stage|column|list|progress)$/],
  ["priority", /^(priority|prio|importance|urgency)$/],
  ["dueDate", /^(due|due ?date|deadline|end ?date|due ?on|end)$/],
  ["startDate", /^(start|start ?date|begin|begins|start ?on)$/],
  ["assignee", /^(assignees?|assigned ?to|owners?|members?|responsible|assigned)$/],
  ["tags", /^(tags?|labels?|categor(y|ies))$/],
  ["points", /^(points|story ?points|sp|estimate|estimation|pts)$/],
];

/** A field per column from its header name; each field at most once, the task name always mapped. */
export function guessCsvMapping(headers: string[]): CsvField[] {
  const used = new Set<CsvField>();
  const mapping = headers.map((header): CsvField => {
    const h = header.trim().toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ");
    const match = FIELD_HEADERS.find(([field, re]) => !used.has(field) && re.test(h));
    if (!match) return "ignore";
    used.add(match[0]);
    return match[0];
  });
  if (!used.has("name") && mapping.length > 0) {
    const first = mapping.findIndex((f) => f === "ignore");
    mapping[first >= 0 ? first : 0] = "name";
  }
  return mapping;
}

/** Turns parsed CSV rows (first row = headers) into the import model with the given mapping. */
export function csvToImport(rows: string[][], mapping: CsvField[], listName: string): ImportModel {
  const warnings: ImportWarning[] = [];
  const col = (field: CsvField) => mapping.indexOf(field);
  const nameCol = col("name");
  const cell = (row: string[], field: CsvField) => {
    const i = col(field);
    return i < 0 ? "" : (row[i] ?? "").trim();
  };
  const data = rows.slice(1);

  if (nameCol < 0) warnings.push({ message: "Map a column to Task name to import tasks." });
  const statusNames = data.map((row) => cell(row, "status")).filter(Boolean);
  const { statuses, resolve } = buildImportStatuses(statusNames);

  const tagColors = new Map<string, string>();
  const tasks: ImportTask[] = [];
  data.forEach((row, index) => {
    const where = `Row ${index + 2}`;
    const name = nameCol < 0 ? "" : clipName(row[nameCol] ?? "");
    if (!name) {
      if (nameCol >= 0) warnings.push({ where, message: "Skipped: no task name" });
      return;
    }
    if (tasks.length >= MAX_IMPORT_TASKS) return;

    const dateOf = (field: "dueDate" | "startDate") => {
      const raw = cell(row, field);
      if (!raw) return null;
      const date = parseImportDate(raw);
      if (!date) warnings.push({ where, message: `Unrecognized date "${clip(raw, 40)}"` });
      return date?.toISOString() ?? null;
    };
    const rawPriority = cell(row, "priority");
    const priority = parseImportPriority(rawPriority);
    if (priority === null) warnings.push({ where, message: `Unknown priority "${clip(rawPriority, 40)}"` });
    const rawPoints = cell(row, "points");
    const points = parseImportPoints(rawPoints);
    if (rawPoints && points === null) warnings.push({ where, message: `Points "${clip(rawPoints, 40)}" is not a number` });

    const tags = [...new Set(splitMulti(cell(row, "tags")).map(tagName).filter(Boolean))].slice(0, 20);
    for (const tag of tags) if (!tagColors.has(tag)) tagColors.set(tag, tagColorFor(tag));
    const description = cell(row, "description");

    tasks.push({
      name,
      description: description ? clip(description, MAX_IMPORT_DESCRIPTION) : null,
      status: resolve(cell(row, "status")),
      priority: priority ?? "none",
      startDate: dateOf("startDate"),
      dueDate: dateOf("dueDate"),
      assignees: [...new Set(splitMulti(cell(row, "assignee")).map((a) => clip(a, 320)))].slice(0, 10),
      tags,
      points,
      checklists: [],
    });
  });
  if (data.filter((row) => nameCol >= 0 && (row[nameCol] ?? "").trim()).length > MAX_IMPORT_TASKS)
    warnings.push({ message: `Only the first ${MAX_IMPORT_TASKS} tasks are imported.` });

  return {
    source: "csv",
    listName: clip(listName, 100) || "Imported list",
    statuses,
    tags: [...tagColors].map(([name, color]) => ({ name, color })),
    tasks,
    warnings,
  };
}

// ---------------------------------------------------------------------------------------------
// Trello board JSON -> import model

interface TrelloLabel {
  id?: string;
  name?: string;
  color?: string | null;
}
interface TrelloBoard {
  name?: string;
  lists?: { id: string; name?: string; closed?: boolean; pos?: number }[];
  cards?: {
    id?: string;
    name?: string;
    desc?: string;
    closed?: boolean;
    idList?: string;
    pos?: number;
    due?: string | null;
    start?: string | null;
    labels?: TrelloLabel[];
    idLabels?: string[];
    idMembers?: string[];
  }[];
  labels?: TrelloLabel[];
  checklists?: {
    id?: string;
    idCard?: string;
    name?: string;
    pos?: number;
    checkItems?: { name?: string; state?: string; pos?: number }[];
  }[];
  members?: { id: string; fullName?: string; username?: string }[];
}

const byPos = <T extends { pos?: number }>(a: T, b: T) => (a.pos ?? 0) - (b.pos ?? 0);

/** True when the JSON looks like a Trello board export (lists and cards arrays). */
export function isTrelloBoard(json: unknown): json is TrelloBoard {
  return (
    typeof json === "object" &&
    json !== null &&
    Array.isArray((json as TrelloBoard).lists) &&
    Array.isArray((json as TrelloBoard).cards)
  );
}

/**
 * A Trello board export (Board menu > Print, export and share > Export as JSON) as an import model:
 * open lists become statuses in board order (the last one, or a "Done"-like one, is the done
 * status), cards become tasks (name, description, start and due dates, labels as tags with Trello
 * colors, members as assignees, checklists). Cards of archived lists are skipped; archived cards are
 * skipped or, with `closedCards: "done"`, imported in the done status.
 */
export function trelloToImport(json: unknown, { closedCards = "skip" }: { closedCards?: "skip" | "done" } = {}): ImportModel {
  if (!isTrelloBoard(json)) throw new Error("This file is not a Trello board export (no lists or cards).");
  const warnings: ImportWarning[] = [];
  const lists = (json.lists ?? []).filter((l) => !l.closed).sort(byPos);
  const listOrder = new Map(lists.map((l, i) => [l.id, i]));
  const { statuses, resolve, done } = buildImportStatuses(
    lists.map((l) => l.name ?? ""),
    { lastIsDone: true },
  );

  const boardLabels = new Map((json.labels ?? []).filter((l) => l.id).map((l) => [l.id!, l]));
  const members = new Map((json.members ?? []).map((m) => [m.id, m.fullName || m.username || ""]));
  const checklistsByCard = new Map<string, NonNullable<TrelloBoard["checklists"]>>();
  for (const c of json.checklists ?? []) {
    if (!c.idCard) continue;
    checklistsByCard.set(c.idCard, [...(checklistsByCard.get(c.idCard) ?? []), c]);
  }

  const tagColors = new Map<string, string>();
  const labelTag = (label: TrelloLabel) => {
    const name = tagName(label.name || (label.color ?? "").replace(/_/g, " ") || "label");
    if (name && !tagColors.has(name)) tagColors.set(name, trelloColor(label.color));
    return name;
  };

  let archived = 0;
  let inArchivedLists = 0;
  const cards = (json.cards ?? [])
    .filter((card) => {
      if (!card.idList || !listOrder.has(card.idList)) {
        inArchivedLists++;
        return false;
      }
      if (card.closed && closedCards === "skip") {
        archived++;
        return false;
      }
      return true;
    })
    .sort((a, b) => listOrder.get(a.idList!)! - listOrder.get(b.idList!)! || byPos(a, b));

  const tasks: ImportTask[] = [];
  for (const card of cards) {
    const name = clipName(card.name ?? "");
    if (!name) continue;
    if (tasks.length >= MAX_IMPORT_TASKS) {
      warnings.push({ message: `Only the first ${MAX_IMPORT_TASKS} cards are imported.` });
      break;
    }
    const iso = (value: string | null | undefined, field: string) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        warnings.push({ where: name, message: `Unrecognized ${field} "${clip(value, 40)}"` });
        return null;
      }
      return date.toISOString();
    };
    const labels = card.labels ?? (card.idLabels ?? []).map((id) => boardLabels.get(id)).filter((l): l is TrelloLabel => !!l);
    const listName = lists.find((l) => l.id === card.idList)?.name;
    const desc = (card.desc ?? "").trim();

    tasks.push({
      name,
      description: desc ? clip(desc, MAX_IMPORT_DESCRIPTION) : null,
      status: card.closed ? done : resolve(listName),
      priority: "none",
      startDate: iso(card.start, "start date"),
      dueDate: iso(card.due, "due date"),
      assignees: [...new Set((card.idMembers ?? []).map((id) => members.get(id) ?? "").filter(Boolean))].slice(0, 10),
      tags: [...new Set(labels.map(labelTag).filter(Boolean))].slice(0, 20),
      points: null,
      checklists: (checklistsByCard.get(card.id ?? "") ?? [])
        .sort(byPos)
        .slice(0, 20)
        .map((c) => ({
          name: clip(c.name ?? "", 128) || "Checklist",
          items: (c.checkItems ?? [])
            .slice()
            .sort(byPos)
            .map((item) => ({ text: clip(item.name ?? "", 256), done: item.state === "complete" }))
            .filter((item) => item.text)
            .slice(0, 100),
        })),
    });
  }
  if (archived > 0) warnings.push({ message: `${archived} archived card${archived === 1 ? "" : "s"} skipped.` });
  if (inArchivedLists > 0)
    warnings.push({ message: `${inArchivedLists} card${inArchivedLists === 1 ? "" : "s"} in archived lists skipped.` });

  return {
    source: "trello",
    listName: clip(json.name ?? "", 100) || "Trello board",
    statuses,
    tags: [...tagColors].map(([name, color]) => ({ name, color })),
    tasks,
    warnings,
  };
}

// ---------------------------------------------------------------------------------------------
// Summary and rich text

export function summarizeImport(model: Pick<ImportModel, "statuses" | "tags" | "tasks">) {
  return {
    tasks: model.tasks.length,
    statuses: model.statuses.length,
    withDueDates: model.tasks.filter((t) => t.dueDate).length,
    tags: model.tags.length,
    checklists: model.tasks.reduce((n, t) => n + t.checklists.length, 0),
    assigned: model.tasks.filter((t) => t.assignees.length > 0).length,
  };
}

/** Plain text as a Tiptap document: one paragraph per line (blank lines become empty paragraphs). */
export function textToRichDoc(text: string) {
  return {
    type: "doc" as const,
    content: text
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => (line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" })),
  };
}
