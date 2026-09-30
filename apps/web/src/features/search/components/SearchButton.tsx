"use client";

import { ICONS_MAP } from "@/shared/icons/icons-map";
import { usePaletteStore } from "./CommandPalette";

/** Sidebar search trigger; Ctrl/Cmd+K opens the same palette from anywhere. */
function SearchButton() {
  const setOpen = usePaletteStore((s) => s.setOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search (Ctrl K)"
      className="flex flex-col items-center gap-1"
    >
      <span className="rounded-lg p-1.5 hover:bg-neutral-500/20">
        <ICONS_MAP.search className="size-6" />
      </span>
      <span className="text-xs font-medium md:font-bold">Search</span>
      <kbd className="max-sm:hidden rounded border border-neutral-400 px-1 text-[10px] text-neutral-500">Ctrl K</kbd>
    </button>
  );
}

export default SearchButton;
