import { TriangleAlert } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import { ToolTip, ToolTipMessage, ToolTipTrigger } from "@/shared/ui/ToolTip/ToolTip";
import { wipState } from "../lib/swimlanes";

/** Column task count; with a WIP limit it reads "5 / 4" and turns red with a warning when exceeded. */
function WipCount({ count, limit }: { count: number | undefined; limit: number | null | undefined }) {
  const state = wipState(count ?? 0, limit);
  if (state === "none") {
    return <span className="text-sm text-neutral-600/80 dark:text-neutral-400/80">{count}</span>;
  }
  const label = (
    <span
      aria-label={`${count} of ${limit} WIP limit`}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1 text-sm tabular-nums",
        state === "exceeded"
          ? "bg-red-500/15 font-semibold text-red-600 dark:text-red-400"
          : state === "full"
            ? "text-amber-700 dark:text-amber-400"
            : "text-neutral-600/80 dark:text-neutral-400/80",
      )}
    >
      {state === "exceeded" && <TriangleAlert className="size-3.5" aria-hidden />}
      {count} / {limit}
    </span>
  );
  return (
    <ToolTip>
      <ToolTipTrigger>{label}</ToolTipTrigger>
      <ToolTipMessage>
        {state === "exceeded" ? `WIP limit exceeded (${count} of ${limit})` : `WIP limit: ${limit}`}
      </ToolTipMessage>
    </ToolTip>
  );
}

export default WipCount;
