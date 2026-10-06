"use client";

import { useState } from "react";
import { Ellipsis } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSetWipLimit } from "@/features/status/hooks/useSetWipLimit";
import type { Status } from "@/features/status/types";

/** The column header's "…" menu: set or clear the column's WIP limit. */
function ColumnMenu({ status }: { status: Status }) {
  const { setWipLimit } = useSetWipLimit();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const parsed = Number(value);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 999;

  const save = (wipLimit: number | null) => {
    setWipLimit({ statusId: status.id, wipLimit });
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(status.wipLimit ? String(status.wipLimit) : "");
      }}
    >
      <PopoverTrigger
        aria-label={`${status.name} column options`}
        className="flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-900/10 hover:text-neutral-800 dark:hover:bg-white/10 dark:hover:text-neutral-200"
      >
        <Ellipsis className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-3">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save(parsed);
          }}
        >
          <label htmlFor={`wip-${status.id}`} className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            Set WIP limit
          </label>
          <p className="text-xs text-neutral-500">Max tasks in this column. The header warns when it is exceeded.</p>
          <input
            id={`wip-${status.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 4"
            className="h-8 rounded-md border border-neutral-200 px-2 text-sm dark:border-neutral-800 dark:bg-transparent"
          />
          <div className="flex justify-end gap-2">
            {status.wipLimit != null && (
              <button
                type="button"
                onClick={() => save(null)}
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={!valid}
              className="cursor-pointer rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export default ColumnMenu;
