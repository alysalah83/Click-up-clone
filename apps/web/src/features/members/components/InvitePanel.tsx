"use client";

import { useState, useTransition } from "react";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Button } from "@/shared/ui/Button";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { createInviteAction } from "../actions/members.actions";

interface InvitePanelProps {
  /** Workspaces where I can invite (owner/admin). */
  workspaces: { id: string; name: string }[];
}

/** Creates an invite link, with copy-to-clipboard and an "Open as teammate" demo shortcut. */
function InvitePanel({ workspaces }: InvitePanelProps) {
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (workspaces.length === 0) return null;

  const createLink = (then?: (url: string) => void) =>
    startTransition(async () => {
      const response = await createInviteAction(workspaceId, "member");
      if (response.status === "error") {
        window.toast?.error(formatErrorForToast(response.error), 7);
        return;
      }
      if (!("payload" in response)) return;
      // Built from this page's origin, so the link works on any deployment (and locally).
      const url = `${window.location.origin}/invite/${response.payload.token}`;
      setLink(url);
      setCopied(false);
      then?.(url);
    });

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.toast?.error("Could not copy: select the link and copy it manually", 5);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Invite people</h3>
          <p className="text-xs text-neutral-500">Anyone with the link can join as a member for 7 days.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={workspaceId}
            onChange={(e) => {
              setWorkspaceId(e.target.value);
              setLink(null);
            }}
            aria-label="space to invite to"
            className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm text-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id} className="bg-neutral-100 dark:bg-neutral-900">
                {w.name}
              </option>
            ))}
          </select>
          <Button
            ariaLabel="create invite link"
            buttonFor="button"
            size="small"
            pending={isPending}
            onClick={() => createLink((url) => copy(url))}
          >
            <span className="flex items-center gap-1.5">
              <ICONS_MAP.link className="size-3.5" /> Invite
            </span>
          </Button>
          <Button
            ariaLabel="open as teammate"
            buttonFor="button"
            type="secondary"
            size="small"
            disabled={isPending}
            onClick={() =>
              link ? window.open(link, "_blank") : createLink((url) => window.open(url, "_blank"))
            }
          >
            <span className="flex items-center gap-1.5">
              <ICONS_MAP.externalLink className="size-3.5" /> Open as teammate
            </span>
          </Button>
        </div>
      </header>

      {link && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            aria-label="invite link"
            onFocus={(e) => e.target.select()}
            className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-xs text-neutral-700 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-300"
          />
          <button
            type="button"
            onClick={() => copy(link)}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-500/10 dark:text-violet-400"
          >
            {copied ? <ICONS_MAP.checkMark className="size-3.5" /> : <ICONS_MAP.copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <p className="text-xs text-neutral-500">
        <span className="font-medium">Open as teammate:</span> Open in an incognito window to act as a
        second user (paste the link there), then assign tasks to each other.
      </p>
    </section>
  );
}

export default InvitePanel;
