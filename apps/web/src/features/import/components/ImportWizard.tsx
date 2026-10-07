"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import type { CsvField, ImportPayload } from "@clickup/shared/importParse";
import { Button } from "@/components/ui/button";
import { axiosClient } from "@/shared/lib/axios/client";
import { cn } from "@/shared/lib/utils/cn";
import { useWorkspaceNames } from "@/features/docs/hooks/useDocs";
import { usePeople } from "@/features/members/hooks/useMembers";
import { refreshAfterImport } from "../actions";
import { buildModel, defaultListName, defaultMapping, type ParsedFile } from "../lib";
import SourceStep from "./SourceStep";
import MapStep from "./MapStep";

type ImportResult = { listId: string; workspaceId: string; tasksCount: number; statusesCount: number };

const STEPS = ["Source", "Map & preview", "Import"] as const;

/**
 * The CSV / Trello import wizard (rendered inside a modal): pick a file or a sample, map and
 * preview, then create the list in one API call and open its Board.
 */
function ImportWizard({ defaultWorkspaceId, onClose }: { defaultWorkspaceId?: string; onClose: () => void }) {
  const router = useRouter();
  const { data: spaces = [] } = useWorkspaceNames();
  const { people } = usePeople();
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [listName, setListName] = useState("");
  const [mapping, setMapping] = useState<CsvField[]>([]);
  const [closedCards, setClosedCards] = useState<"skip" | "done">("skip");
  const [pickedWorkspace, setPickedWorkspace] = useState<string | undefined>(defaultWorkspaceId);
  const workspaceId = pickedWorkspace ?? spaces[0]?.id ?? "";

  const model = useMemo(
    () => (parsed ? buildModel(parsed, { listName, mapping, closedCards }) : null),
    [parsed, listName, mapping, closedCards],
  );

  const memberKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const p of people ?? []) {
      if (!p.workspaces.some((w) => w.id === workspaceId)) continue;
      if (p.name) keys.add(p.name.trim().toLowerCase());
      if (p.email) keys.add(p.email.trim().toLowerCase());
    }
    return keys;
  }, [people, workspaceId]);

  const importList = useMutation({
    mutationFn: async (payload: ImportPayload) => {
      const result = await axiosClient.post<ImportResult>("/api/imports", payload);
      // The list exists either way; a failed cache refresh only delays it in the sidebar.
      await refreshAfterImport(result.workspaceId, result.listId).catch(() => router.refresh());
      return result;
    },
  });

  const step = importList.isIdle ? (parsed ? 1 : 0) : 2;

  const onParsed = (next: ParsedFile) => {
    setParsed(next);
    setListName(defaultListName(next));
    setMapping(defaultMapping(next));
    setClosedCards("skip");
  };

  const start = () => {
    if (!model || !workspaceId) return;
    const { warnings: _warnings, ...rest } = model;
    importList.mutate({ ...rest, workspaceId });
  };

  const canImport = !!model && model.tasks.length > 0 && listName.trim().length > 0 && !!workspaceId;
  const openList = (listId: string) => {
    router.push(`/home/lists/${listId}/board`);
    onClose();
  };

  return (
    <div className="flex w-[min(860px,calc(100vw-2rem))] flex-col text-neutral-700 dark:text-neutral-300">
      <header className="flex flex-col gap-4 border-b border-neutral-200 px-6 pb-4 pt-6 dark:border-neutral-800">
        <div className="pr-10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Import tasks</h2>
          <p className="text-sm text-neutral-500">Create a new list from a CSV file or a Trello board.</p>
        </div>
        <ol className="flex items-center gap-2 text-xs font-medium" aria-label="Import steps">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2" aria-current={i === step ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px]",
                  i < step && "bg-violet-600 text-white",
                  i === step && "bg-violet-600 text-white ring-4 ring-violet-500/20",
                  i > step && "bg-neutral-200 text-neutral-500 dark:bg-neutral-800",
                )}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className={i === step ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500"}>{label}</span>
              {i < STEPS.length - 1 && <span className="h-px w-6 bg-neutral-300 sm:w-10 dark:bg-neutral-700" />}
            </li>
          ))}
        </ol>
      </header>

      <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto px-6 py-5">
        {step === 0 && <SourceStep onParsed={onParsed} />}
        {step === 1 && parsed && model && (
          <MapStep
            parsed={parsed}
            model={model}
            listName={listName}
            onListName={setListName}
            workspaceId={workspaceId}
            onWorkspace={setPickedWorkspace}
            spaces={spaces}
            mapping={mapping}
            onMapping={setMapping}
            closedCards={closedCards}
            onClosedCards={setClosedCards}
            memberKeys={memberKeys}
          />
        )}
        {step === 2 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center" aria-live="polite">
            {importList.isPending && (
              <>
                <LoaderCircle className="size-10 animate-spin text-violet-500" />
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  Importing {model?.tasks.length} tasks into “{listName.trim()}”…
                </p>
                <div className="h-1.5 w-64 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div className="h-full w-full animate-pulse rounded-full bg-violet-500" />
                </div>
              </>
            )}
            {importList.isSuccess && (
              <>
                <CircleCheck className="size-12 text-emerald-500" />
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Import complete</p>
                <p className="text-sm text-neutral-500">
                  Created “{listName.trim()}” with {importList.data.tasksCount} tasks and {importList.data.statusesCount}{" "}
                  statuses.
                </p>
              </>
            )}
            {importList.isError && (
              <>
                <TriangleAlert className="size-10 text-red-500" />
                <p className="font-medium text-neutral-900 dark:text-neutral-100">The import failed</p>
                <p className="text-sm text-neutral-500">{importList.error.message}</p>
              </>
            )}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
        {step === 1 && (
          <Button type="button" variant="ghost" onClick={() => setParsed(null)}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        )}
        {step === 2 && importList.isError && (
          <Button type="button" variant="ghost" onClick={() => importList.reset()}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!(step === 2 && importList.isSuccess) && (
            <Button type="button" variant="outline" onClick={onClose} disabled={importList.isPending}>
              Cancel
            </Button>
          )}
          {step === 1 && (
            <Button
              type="button"
              className="bg-violet-600 text-white hover:bg-violet-700"
              disabled={!canImport}
              onClick={start}
            >
              Import {model?.tasks.length ?? 0} tasks
            </Button>
          )}
          {step === 2 && importList.isSuccess && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  importList.reset();
                  setParsed(null);
                }}
              >
                Import another
              </Button>
              <Button
                type="button"
                className="bg-violet-600 text-white hover:bg-violet-700"
                onClick={() => openList(importList.data.listId)}
              >
                Open list
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

export default ImportWizard;
