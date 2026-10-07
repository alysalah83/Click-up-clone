import {
  MAX_IMPORT_FILE_BYTES,
  csvToImport,
  guessCsvMapping,
  parseCsv,
  trelloToImport,
  type CsvField,
  type ImportModel,
} from "@clickup/shared/importParse";

export type ImportKind = "csv" | "trello";

/** A file read in the browser, before mapping. */
export type ParsedFile =
  | { kind: "csv"; fileName: string; rows: string[][] }
  | { kind: "trello"; fileName: string; json: unknown; boardName: string };

export const SAMPLES = {
  csv: { url: "/samples/sample-tasks.csv", fileName: "sample-tasks.csv" },
  trello: { url: "/samples/trello-website-relaunch.json", fileName: "trello-website-relaunch.json" },
} as const;

/** "Q4 roadmap.csv" -> "Q4 roadmap". */
export const baseName = (fileName: string) => fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

/** Reads CSV or Trello JSON text (detected by extension, then content). Throws a readable message. */
export function parseImportText(text: string, fileName: string): ParsedFile {
  const looksJson = /\.json$/i.test(fileName) || /^\s*[{[]/.test(text);
  if (looksJson) {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("This JSON file could not be read.");
    }
    const model = trelloToImport(json); // throws when it is not a Trello board
    return { kind: "trello", fileName, json, boardName: model.listName };
  }
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("The CSV file needs a header row and at least one task row.");
  return { kind: "csv", fileName, rows };
}

export async function readImportFile(file: File): Promise<ParsedFile> {
  if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error("The file is larger than 2 MB.");
  return parseImportText(await file.text(), file.name);
}

export function defaultListName(parsed: ParsedFile) {
  return parsed.kind === "trello" ? parsed.boardName : baseName(parsed.fileName) || "Imported list";
}

export function defaultMapping(parsed: ParsedFile): CsvField[] {
  return parsed.kind === "csv" ? guessCsvMapping(parsed.rows[0] ?? []) : [];
}

export function buildModel(
  parsed: ParsedFile,
  options: { listName: string; mapping: CsvField[]; closedCards: "skip" | "done" },
): ImportModel {
  if (parsed.kind === "csv") return csvToImport(parsed.rows, options.mapping, options.listName);
  return { ...trelloToImport(parsed.json, { closedCards: options.closedCards }), listName: options.listName.trim() };
}

/** Sets a column's field; a field other than "ignore" moves off any other column. */
export function setColumnField(mapping: CsvField[], column: number, field: CsvField): CsvField[] {
  return mapping.map((current, i) => {
    if (i === column) return field;
    return field !== "ignore" && current === field ? "ignore" : current;
  });
}
