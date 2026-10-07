"use client";

import { useState, useSyncExternalStore } from "react";
import { Copy, ExternalLink, Globe, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils/cn";
import { useResetShareLink, useSetShareActive, useShareLink } from "../hooks";
import { sharePath, timeAgo, viewsLabel } from "../lib";
import type { ShareTarget } from "../types";

const noop = () => () => {};
/** window.location.origin on the client, "" during server rendering (no hydration mismatch). */
const useOrigin = () => useSyncExternalStore(noop, () => window.location.origin, () => "");

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Public share link"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full transition",
          checked ? "bg-violet-600" : "bg-neutral-300 dark:bg-neutral-700",
        )}
      />
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
          checked ? "left-4.5" : "left-0.5",
        )}
      />
    </button>
  );
}

function ShareBody({ target }: { target: ShareTarget }) {
  const { data, isPending, error } = useShareLink(target);
  const { mutate: setActive, isPending: isToggling } = useSetShareActive(target);
  const { mutate: reset, isPending: isResetting } = useResetShareLink(target);
  const origin = useOrigin();

  if (isPending)
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  if (error || !data) return <p className="text-sm text-muted-foreground">Could not load the share settings.</p>;

  const { link, canManage } = data;
  const isActive = !!link?.isActive;
  const url = link ? `${origin}${sharePath(link.token)}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it instead.");
    }
  };

  const onReset = () => {
    if (window.confirm("Reset the link? Anyone using the current link will lose access.")) reset();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <Globe className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Share link</p>
          <p className="text-xs text-muted-foreground">Anyone with the link can view, read-only.</p>
        </div>
        <Switch checked={isActive} disabled={!canManage || isToggling || isResetting} onChange={(v) => setActive(v)} />
      </div>

      {isActive && link ? (
        <>
          <div className="flex items-center gap-1.5">
            <input
              readOnly
              aria-label="Public link"
              value={url}
              onFocus={(e) => e.target.select()}
              className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 font-mono text-xs text-neutral-700 outline-none focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            />
            <Button size="sm" className="h-8 bg-violet-600 text-white hover:bg-violet-700" onClick={copy}>
              <Copy /> Copy
            </Button>
            <Button size="icon-sm" variant="outline" asChild>
              <a href={sharePath(link.token)} target="_blank" rel="noopener noreferrer" aria-label="Open link in a new tab" title="Open">
                <ExternalLink />
              </a>
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {viewsLabel(link.viewCount)}
              {link.lastViewedAt && ` · last viewed ${timeAgo(link.lastViewedAt)}`}
            </span>
            {canManage && (
              <button
                type="button"
                onClick={onReset}
                disabled={isResetting}
                className="flex cursor-pointer items-center gap-1 font-medium text-neutral-600 hover:text-violet-600 disabled:opacity-50 dark:text-neutral-300"
              >
                <RotateCcw className="size-3" /> Reset link
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-md bg-neutral-100 px-2.5 py-2 text-xs text-muted-foreground dark:bg-neutral-800/60">
          {canManage ? "Turn it on to get a public, read-only link." : "Sharing is off."}
        </p>
      )}
      {!canManage && <p className="text-xs text-muted-foreground">Only members of this space can change sharing.</p>}
    </div>
  );
}

/** ClickUp-style "Share" button and popover: a public read-only link for a list or a doc. */
function SharePopover({ target, className }: { target: ShareTarget; className?: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useShareLink(target);
  const isShared = !!data?.link?.isActive;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Share this ${target.resourceType}`}
          className={cn("gap-1.5", isShared && "border-violet-300 text-violet-700 dark:border-violet-500/40 dark:text-violet-300", className)}
        >
          <Share2 /> <span className="hidden sm:inline">Share</span>
          {isShared && <span aria-hidden className="size-1.5 rounded-full bg-violet-500" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))]">
        <p className="mb-3 text-sm font-semibold">Share this {target.resourceType}</p>
        {open && <ShareBody target={target} />}
      </PopoverContent>
    </Popover>
  );
}

export default SharePopover;
