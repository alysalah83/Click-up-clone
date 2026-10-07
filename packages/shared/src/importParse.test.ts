import { describe, expect, it } from "vitest";
import {
  buildImportStatuses,
  csvToImport,
  detectCsvDelimiter,
  guessCsvMapping,
  parseCsv,
  parseImportDate,
  parseImportPoints,
  parseImportPriority,
  splitMulti,
  summarizeImport,
  textToRichDoc,
  trelloColor,
  trelloToImport,
} from "./importParse.js";
import { importPayloadSchema } from "./import.js";

describe("parseCsv", () => {
  it("parses quoted fields, escaped quotes, newlines inside quotes and CRLF", () => {
    const text = 'Title,Notes\r\n"Fix ""login""","line 1\r\nline 2"\r\nPlain,,\r\n';
    expect(parseCsv(text)).toEqual([
      ["Title", "Notes"],
      ['Fix "login"', "line 1\r\nline 2"],
      ["Plain", "", ""],
    ]);
  });

  it("strips a BOM, skips blank lines and keeps a last line without newline", () => {
    expect(parseCsv("﻿a,b\n\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles LF-only, CR-only and an empty quoted field", () => {
    expect(parseCsv('a,b\n"",x')).toEqual([
      ["a", "b"],
      ["", "x"],
    ]);
    expect(parseCsv("a,b\r1,2\r")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("detects comma, semicolon and tab delimiters from the first line", () => {
    expect(detectCsvDelimiter("a;b;c\n1,5;2;3")).toBe(";");
    expect(detectCsvDelimiter("a\tb\tc")).toBe("\t");
    expect(detectCsvDelimiter('"x;y",b,c')).toBe(",");
    expect(detectCsvDelimiter("single")).toBe(",");
    expect(parseCsv("Name;Due\nTask;08.10.2026")).toEqual([
      ["Name", "Due"],
      ["Task", "08.10.2026"],
    ]);
    expect(parseCsv("Name\tTags\nA\tx, y")).toEqual([
      ["Name", "Tags"],
      ["A", "x, y"],
    ]);
  });

  it("keeps commas inside quotes and an explicit delimiter", () => {
    expect(parseCsv('"a,b",c', ",")).toEqual([["a,b", "c"]]);
  });
});

describe("parseImportDate", () => {
  const utc = (v: string) => parseImportDate(v)?.toISOString();

  it("reads date-only values as 12:00 UTC of that day", () => {
    expect(utc("2026-10-08")).toBe("2026-10-08T12:00:00.000Z");
    expect(utc("10/08/2026")).toBe("2026-10-08T12:00:00.000Z");
    expect(utc("25/12/2026")).toBe("2026-12-25T12:00:00.000Z");
    expect(utc("08.10.2026")).toBe("2026-10-08T12:00:00.000Z");
    expect(utc("8-10-2026")).toBe("2026-10-08T12:00:00.000Z");
    expect(utc("2026/10/08")).toBe("2026-10-08T12:00:00.000Z");
    expect(utc("Oct 8, 2026")).toBe("2026-10-08T12:00:00.000Z");
    expect(utc("8 October 2026")).toBe("2026-10-08T12:00:00.000Z");
    expect(utc("10/08/26")).toBe("2026-10-08T12:00:00.000Z");
  });

  it("keeps zoned ISO timestamps exact", () => {
    expect(utc("2026-10-08T14:00:00.000Z")).toBe("2026-10-08T14:00:00.000Z");
    expect(utc("2026-10-08T14:00:00+02:00")).toBe("2026-10-08T12:00:00.000Z");
  });

  it("reads a time without zone as local time", () => {
    const date = parseImportDate("2026-10-08 14:00")!;
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2026, 9, 8, 14, 0]);
    const pm = parseImportDate("10/08/2026 2:30 PM")!;
    expect([pm.getHours(), pm.getMinutes()]).toEqual([14, 30]);
    expect(parseImportDate("08.10.2026 09:15")!.getHours()).toBe(9);
  });

  it("rejects impossible dates and junk", () => {
    for (const v of ["", "soon", "2026-02-30", "13/13/2026", "2026-10-08 25:00", "31.04.2026", "Foo 8, 2026", "1/2"])
      expect(parseImportDate(v)).toBeNull();
  });
});

describe("priority, points and multi values", () => {
  it("maps priority words and numbers", () => {
    expect(parseImportPriority("Urgent")).toBe("urgent");
    expect(parseImportPriority("critical")).toBe("urgent");
    expect(parseImportPriority(" HIGH ")).toBe("high");
    expect(parseImportPriority("Medium")).toBe("normal");
    expect(parseImportPriority("4")).toBe("low");
    expect(parseImportPriority("P2")).toBe("high");
    expect(parseImportPriority("")).toBe("none");
    expect(parseImportPriority("whenever")).toBeNull();
  });

  it("parses points", () => {
    expect(parseImportPoints("5")).toBe(5);
    expect(parseImportPoints("2,5")).toBe(3);
    expect(parseImportPoints("")).toBeNull();
    expect(parseImportPoints("big")).toBeNull();
    expect(parseImportPoints("5000")).toBe(999);
  });

  it("splits multi-value cells", () => {
    expect(splitMulti("a, b; c | d\n e,,")).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("buildImportStatuses", () => {
  it("picks the to-do-like name as open and the done-like name as done", () => {
    const { statuses, resolve } = buildImportStatuses(["In Progress", "Done", "To Do", "Review", "in progress"]);
    expect(statuses).toEqual([
      { name: "To Do", type: "open", color: "neutral" },
      { name: "In Progress", type: "active", color: "violet" },
      { name: "Review", type: "active", color: "amber" },
      { name: "Done", type: "done", color: "emerald" },
    ]);
    expect(resolve("done")).toBe("Done");
    expect(resolve("")).toBe("To Do");
  });

  it("adds a done and an active status when missing, and the defaults for no names", () => {
    expect(buildImportStatuses(["Ideas"]).statuses.map((s) => `${s.name}:${s.type}`)).toEqual([
      "Ideas:open",
      "in progress:active",
      "complete:done",
    ]);
    expect(buildImportStatuses([]).statuses.map((s) => s.name)).toEqual(["to do", "in progress", "complete"]);
  });

  it("uses the last name as done when asked (Trello)", () => {
    const { statuses } = buildImportStatuses(["Backlog", "Doing", "Shipped it"], { lastIsDone: true });
    expect(statuses.map((s) => s.type)).toEqual(["open", "active", "done"]);
    expect(statuses[2]!.name).toBe("Shipped it");
  });
});

describe("CSV mapping", () => {
  it("guesses fields from header names", () => {
    expect(
      guessCsvMapping(["Title", "Description", "Status", "Priority", "Due date", "Assignee", "Labels", "Story points", "Extra"]),
    ).toEqual(["name", "description", "status", "priority", "dueDate", "assignee", "tags", "points", "ignore"]);
    expect(guessCsvMapping(["Task name", "Name"])).toEqual(["name", "ignore"]);
    expect(guessCsvMapping(["Foo", "Due"])).toEqual(["name", "dueDate"]);
  });

  it("builds tasks, statuses, tags and warnings", () => {
    const rows = parseCsv(
      [
        "Title,Status,Priority,Due,Labels,Points,Owner",
        "Write spec,To do,High,10/08/2026,\"Docs, Q4\",3,Maya Chen",
        ",Done,,,,,",
        "Ship,Done,whenever,not a date,q4,x,",
      ].join("\n"),
    );
    const model = csvToImport(rows, guessCsvMapping(rows[0]!), " Roadmap ");
    expect(model.listName).toBe("Roadmap");
    expect(model.statuses.map((s) => s.name)).toEqual(["To do", "in progress", "Done"]);
    expect(model.tags).toEqual([
      { name: "docs", color: expect.stringMatching(/^#/) },
      { name: "q4", color: expect.stringMatching(/^#/) },
    ]);
    expect(model.tasks).toHaveLength(2);
    expect(model.tasks[0]).toMatchObject({
      name: "Write spec",
      status: "To do",
      priority: "high",
      dueDate: "2026-10-08T12:00:00.000Z",
      tags: ["docs", "q4"],
      points: 3,
      assignees: ["Maya Chen"],
    });
    expect(model.tasks[1]).toMatchObject({ status: "Done", priority: "none", dueDate: null, points: null });
    expect(model.warnings.map((w) => `${w.where}: ${w.message}`)).toEqual([
      "Row 3: Skipped: no task name",
      'Row 4: Unknown priority "whenever"',
      'Row 4: Points "x" is not a number',
      'Row 4: Unrecognized date "not a date"',
    ]);
    expect(summarizeImport(model)).toMatchObject({ tasks: 2, statuses: 3, withDueDates: 1, tags: 2 });
    expect(importPayloadSchema.safeParse({ ...model, workspaceId: crypto.randomUUID() }).success).toBe(true);
  });
});

const board = {
  name: "Website Relaunch",
  lists: [
    { id: "l2", name: "Doing", pos: 2 },
    { id: "l1", name: "Backlog", pos: 1 },
    { id: "lx", name: "Old", pos: 3, closed: true },
    { id: "l3", name: "Live", pos: 4 },
  ],
  labels: [{ id: "lb1", name: "Design", color: "purple" }, { id: "lb2", name: "", color: "green_dark" }],
  members: [{ id: "m1", fullName: "Maya Chen", username: "maya" }],
  cards: [
    { id: "c1", name: "Hero", idList: "l2", pos: 2, desc: "New hero", due: "2026-10-20T15:00:00.000Z", idLabels: ["lb1", "lb2"], idMembers: ["m1"] },
    { id: "c2", name: "Audit", idList: "l1", pos: 1, labels: [{ name: "SEO", color: "sky" }] },
    { id: "c3", name: "Old card", idList: "lx", pos: 1 },
    { id: "c4", name: "Archived", idList: "l1", pos: 3, closed: true },
    { id: "c5", name: "Nav", idList: "l2", pos: 1 },
  ],
  checklists: [
    { id: "k1", idCard: "c1", name: "Steps", pos: 1, checkItems: [{ name: "B", state: "incomplete", pos: 2 }, { name: "A", state: "complete", pos: 1 }] },
  ],
};

describe("trelloToImport", () => {
  it("maps open lists to statuses and cards to tasks in board order", () => {
    const model = trelloToImport(board);
    expect(model.listName).toBe("Website Relaunch");
    expect(model.statuses.map((s) => `${s.name}:${s.type}`)).toEqual(["Backlog:open", "Doing:active", "Live:done"]);
    expect(model.tasks.map((t) => `${t.name}@${t.status}`)).toEqual(["Audit@Backlog", "Nav@Doing", "Hero@Doing"]);
    expect(model.tasks[2]).toMatchObject({
      description: "New hero",
      dueDate: "2026-10-20T15:00:00.000Z",
      tags: ["design", "green dark"],
      assignees: ["Maya Chen"],
      checklists: [{ name: "Steps", items: [{ text: "A", done: true }, { text: "B", done: false }] }],
    });
    expect(model.tags).toEqual([
      { name: "seo", color: "#0092b8" },
      { name: "design", color: "#8f3fd1" },
      { name: "green dark", color: "#1f845a" },
    ]);
    expect(model.warnings.map((w) => w.message)).toEqual(["1 archived card skipped.", "1 card in archived lists skipped."]);
    expect(importPayloadSchema.safeParse({ ...model, workspaceId: crypto.randomUUID() }).success).toBe(true);
  });

  it("imports archived cards as done when asked, and rejects non-Trello JSON", () => {
    const model = trelloToImport(board, { closedCards: "done" });
    expect(model.tasks.find((t) => t.name === "Archived")?.status).toBe("Live");
    expect(() => trelloToImport({ foo: 1 })).toThrow(/not a Trello board/);
    expect(trelloColor("yellow_light")).toBe("#b38600");
    expect(trelloColor(null)).toBe("#626f86");
  });
});

describe("importPayloadSchema", () => {
  const base = {
    workspaceId: crypto.randomUUID(),
    source: "csv",
    listName: "L",
    statuses: [
      { name: "to do", type: "open", color: "neutral" },
      { name: "done", type: "done", color: "emerald" },
    ],
    tasks: [{ name: "A", status: "TO DO" }],
  };

  it("fills task defaults", () => {
    expect(importPayloadSchema.parse(base).tasks[0]).toEqual({
      name: "A",
      description: null,
      status: "TO DO",
      priority: "none",
      startDate: null,
      dueDate: null,
      assignees: [],
      tags: [],
      points: null,
      checklists: [],
    });
  });

  it("rejects unknown statuses, missing done status and too many tasks", () => {
    expect(importPayloadSchema.safeParse({ ...base, tasks: [{ name: "A", status: "nope" }] }).success).toBe(false);
    expect(
      importPayloadSchema.safeParse({ ...base, statuses: [base.statuses[0], { ...base.statuses[1], type: "active" }] }).success,
    ).toBe(false);
    expect(
      importPayloadSchema.safeParse({ ...base, tasks: Array.from({ length: 1001 }, () => ({ name: "A", status: "done" })) })
        .success,
    ).toBe(false);
  });
});

describe("textToRichDoc", () => {
  it("makes one paragraph per line", () => {
    expect(textToRichDoc("a\r\n\nb")).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "a" }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "b" }] },
      ],
    });
  });
});
