"use client";

import { useSyncExternalStore } from "react";
import { Copy, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { publicFormPath } from "../lib";

const noop = () => () => {};
/** window.location.origin on the client, "" during server rendering (no hydration mismatch). */
const useOrigin = () => useSyncExternalStore(noop, () => window.location.origin, () => "");

/** The public link with Copy and Open buttons; greyed out while the form is not accepting responses. */
function ShareBar({ slug, isActive }: { slug: string; isActive: boolean }) {
  const url = `${useOrigin()}${publicFormPath(slug)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Form link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it instead.");
    }
  };

  return (
    <section
      aria-label="Share form"
      className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/70 p-3 sm:flex-row sm:items-center dark:border-violet-500/30 dark:bg-violet-500/10"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-900 dark:text-violet-200">
        <Link2 className="size-4" /> Share
      </div>
      <input
        readOnly
        aria-label="Public form link"
        value={url}
        onFocus={(e) => e.target.select()}
        className={`h-8 min-w-0 flex-1 rounded-md border border-violet-200 bg-white px-2.5 font-mono text-xs text-neutral-700 outline-none focus:border-violet-500 dark:border-violet-500/30 dark:bg-neutral-950 dark:text-neutral-300 ${
          isActive ? "" : "opacity-60"
        }`}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex h-8 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white transition hover:bg-violet-700"
        >
          <Copy className="size-3.5" /> Copy
        </button>
        <a
          href={publicFormPath(slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 items-center gap-1.5 rounded-md border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/30 dark:bg-neutral-900 dark:text-violet-300"
        >
          <ExternalLink className="size-3.5" /> Open form
        </a>
      </div>
    </section>
  );
}

export default ShareBar;
