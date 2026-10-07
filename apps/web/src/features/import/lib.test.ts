import { describe, expect, it } from "vitest";
import { baseName, buildModel, defaultListName, defaultMapping, parseImportText, setColumnField } from "./lib";

describe("import wizard helpers", () => {
  it("detects CSV and Trello files and prefills the list name", () => {
    const csv = parseImportText("Title,Status\nA,Done", "Q4_roadmap.csv");
    expect(csv.kind).toBe("csv");
    expect(defaultListName(csv)).toBe("Q4 roadmap");
    expect(defaultMapping(csv)).toEqual(["name", "status"]);

    const trello = parseImportText(JSON.stringify({ name: "Board", lists: [], cards: [] }), "export.json");
    expect(trello.kind).toBe("trello");
    expect(defaultListName(trello)).toBe("Board");
    expect(buildModel(trello, { listName: " Renamed ", mapping: [], closedCards: "skip" }).listName).toBe("Renamed");
  });

  it("rejects unreadable files", () => {
    expect(() => parseImportText("{oops", "x.json")).toThrow(/could not be read/);
    expect(() => parseImportText('{"a":1}', "x.json")).toThrow(/not a Trello board/);
    expect(() => parseImportText("Title only", "x.csv")).toThrow(/header row/);
  });

  it("keeps each field on one column", () => {
    expect(setColumnField(["name", "status", "ignore"], 2, "status")).toEqual(["name", "ignore", "status"]);
    expect(setColumnField(["name", "status"], 1, "ignore")).toEqual(["name", "ignore"]);
    expect(baseName("my-tasks.export.csv")).toBe("my tasks.export");
  });
});
