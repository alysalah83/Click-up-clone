"use client";

import { useRef, useState } from "react";
import { CloudUpload, Download, FileSpreadsheet, LoaderCircle, SquareKanban, TriangleAlert } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import { SAMPLES, parseImportText, readImportFile, type ImportKind, type ParsedFile } from "../lib";

const SOURCES: { kind: ImportKind; title: string; text: string; Icon: typeof FileSpreadsheet; accent: string }[] = [
  {
    kind: "csv",
    title: "CSV file",
    text: "Spreadsheets, Jira, Asana, Excel or Google Sheets exports",
    Icon: FileSpreadsheet,
    accent: "text-emerald-600 bg-emerald-500/10",
  },
  {
    kind: "trello",
    title: "Trello board",
    text: "A board's JSON export: lists, cards, labels and checklists",
    Icon: SquareKanban,
    accent: "text-sky-600 bg-sky-500/10",
  },
];

/** Step 1: pick CSV or Trello, then drop a file, browse, or try a bundled sample. */
function SourceStep({ onParsed }: { onParsed: (parsed: ParsedFile) => void }) {
  const [kind, setKind] = useState<ImportKind>("csv");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async (read: () => Promise<ParsedFile>) => {
    setLoading(true);
    setError(null);
    try {
      onParsed(await read());
    } catch (e) {
      setError(e instanceof Error ? e.message : "This file could not be read.");
    } finally {
      setLoading(false);
    }
  };

  const loadFile = (file: File | undefined) => file && run(() => readImportFile(file));
  const loadSample = (sample: ImportKind) =>
    run(async () => {
      const res = await fetch(SAMPLES[sample].url);
      if (!res.ok) throw new Error("The sample could not be loaded.");
      return parseImportText(await res.text(), SAMPLES[sample].fileName);
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Import source">
        {SOURCES.map(({ kind: k, title, text, Icon, accent }) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition",
              kind === k
                ? "border-violet-500 bg-violet-500/5 ring-1 ring-violet-500"
                : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600",
            )}
          >
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", accent)}>
              <Icon className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</span>
              <span className="text-xs text-neutral-500">{text}</span>
            </span>
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          loadFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
          dragging
            ? "border-violet-500 bg-violet-500/5"
            : "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40",
        )}
      >
        {loading ? (
          <LoaderCircle className="size-8 animate-spin text-violet-500" />
        ) : (
          <CloudUpload className="size-8 text-neutral-400" />
        )}
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Drag and drop your {kind === "csv" ? ".csv" : "Trello .json"} file here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-neutral-500">Up to 2 MB · up to 1,000 tasks</p>
        <input
          ref={inputRef}
          type="file"
          accept={kind === "csv" ? ".csv,.tsv,.txt,text/csv" : ".json,application/json"}
          className="hidden"
          aria-label="Choose a file to import"
          onChange={(e) => {
            loadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <TriangleAlert className="size-4 shrink-0" /> {error}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-xl bg-neutral-100 px-4 py-3 text-sm dark:bg-neutral-800/60">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">No file at hand?</span>
          <button
            type="button"
            onClick={() => loadSample(kind)}
            disabled={loading}
            className="font-semibold text-violet-600 hover:underline disabled:opacity-50 dark:text-violet-400"
          >
            Try a sample {kind === "csv" ? "CSV" : "Trello board"}
          </button>
          <a
            href={SAMPLES[kind].url}
            download={SAMPLES[kind].fileName}
            className="inline-flex items-center gap-1 text-neutral-600 hover:underline dark:text-neutral-400"
          >
            <Download className="size-3.5" /> Download sample {kind === "csv" ? "CSV" : "JSON"}
          </a>
        </div>
        {kind === "trello" && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-medium">How to export from Trello:</span> open the board, then Board menu (···) →{" "}
            <span className="font-medium">Print, export and share</span> → <span className="font-medium">Export as JSON</span>,
            and save the page as a .json file.
          </p>
        )}
        {kind === "csv" && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            The first row must hold column names. Comma, semicolon and tab separated files work; you map the columns next.
          </p>
        )}
      </div>
    </div>
  );
}

export default SourceStep;
