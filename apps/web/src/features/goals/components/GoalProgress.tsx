import { cn } from "@/shared/lib/utils/cn";
import { percent } from "../lib";

/** ClickUp-style progress ring with the percentage in the middle. */
export function ProgressRing({
  progress,
  color,
  size = 48,
  stroke = 5,
  className,
}: {
  progress: number;
  color: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const pct = percent(progress);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <span
      role="img"
      aria-label={`${pct}% complete`}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span
        className="absolute font-semibold tabular-nums"
        style={{ fontSize: Math.max(10, Math.round(size / 4.2)) }}
      >
        {pct}%
      </span>
    </span>
  );
}

export function ProgressBar({ progress, color, className }: { progress: number; color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800", className)}
    >
      <span
        className="block h-full rounded-full transition-[width] duration-500"
        style={{ width: `${percent(progress)}%`, backgroundColor: color }}
      />
    </span>
  );
}
