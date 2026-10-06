import type { SprintState } from "@/features/list/types";
import { cn } from "@/shared/lib/utils/cn";

const STYLES: Record<SprintState, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  planned: { label: "Planned", className: "bg-neutral-500/15 text-neutral-600 dark:text-neutral-300" },
  completed: { label: "Completed", className: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
};

/** "Active" / "Planned" / "Completed" pill next to a sprint name. */
function SprintStateBadge({ state, className }: { state: SprintState; className?: string }) {
  const { label, className: tone } = STYLES[state];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1.5 py-px text-[10px] font-semibold tracking-wide uppercase",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}

export default SprintStateBadge;
