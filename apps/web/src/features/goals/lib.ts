import type { GoalColor, GoalTarget, GoalTargetType } from "./types";

export const GOAL_COLORS: { value: GoalColor; hex: string }[] = [
  { value: "violet", hex: "#7b68ee" },
  { value: "blue", hex: "#3b82f6" },
  { value: "emerald", hex: "#10b981" },
  { value: "amber", hex: "#f59e0b" },
  { value: "rose", hex: "#f43f5e" },
  { value: "cyan", hex: "#06b6d4" },
];

export const goalHex = (color: string) => GOAL_COLORS.find((c) => c.value === color)?.hex ?? GOAL_COLORS[0]!.hex;

export const TARGET_TYPES: { value: GoalTargetType; label: string; hint: string }[] = [
  { value: "number", label: "Number", hint: "e.g. 340 / 500 signups" },
  { value: "boolean", label: "True / False", hint: "Done or not done" },
  { value: "currency", label: "Currency", hint: "e.g. $4,200 / $12,000" },
  { value: "tasks", label: "Tasks", hint: "Progress from linked tasks" },
];

/** Whole percent, clamped to 0..100. */
export const percent = (progress: number) => Math.round(Math.min(1, Math.max(0, progress)) * 100);

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** "$4,200" for currency targets, "340" (or "340 kg") for numbers. */
export function formatValue(value: number, type: GoalTargetType, unit: string | null) {
  if (type === "currency") {
    const symbol = unit ?? "$";
    return value < 0 ? `-${symbol}${numberFormat.format(-value)}` : `${symbol}${numberFormat.format(value)}`;
  }
  const n = numberFormat.format(value);
  return unit ? `${n} ${unit}` : n;
}

type SummaryInput = Pick<GoalTarget, "type" | "currentValue" | "targetValue" | "unit" | "doneCount"> & {
  tasks: unknown[];
};

/** The short "where it stands" text of a target. */
export function targetSummary(target: SummaryInput) {
  switch (target.type) {
    case "boolean":
      return target.currentValue >= 1 ? "Done" : "Not done";
    case "tasks":
      return `${target.doneCount} / ${target.tasks.length} ${target.tasks.length === 1 ? "task" : "tasks"}`;
    default:
      return `${formatValue(target.currentValue, target.type, target.unit)} / ${formatValue(target.targetValue, target.type, target.unit)}`;
  }
}

/** Due dates sit at 12:00 UTC (a calendar day). Overdue = the day is before today (local). */
export function dueLabel(dueDate: string | null, now = new Date()) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((day(due) - day(now)) / 86_400_000);
  const sameYear = due.getFullYear() === now.getFullYear();
  const text = due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return { text, overdue: diffDays < 0, soon: diffDays >= 0 && diffDays <= 7 };
}

/** `<input type="date">` value <-> the API's 12:00 UTC timestamp. */
export const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
export const fromDateInput = (value: string) => (value ? `${value}T12:00:00.000Z` : null);
