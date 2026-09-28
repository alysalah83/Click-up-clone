import { Task } from "../../types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CALENDER_PRIORITY_COLORS: Record<Task["priority"], string> = {
  urgent: "bg-pink-500/20 border-pink-500 text-pink-700 dark:text-pink-300",
  high: "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300",
  normal: "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300",
  low: "bg-stone-500/20 border-stone-500 text-stone-600 dark:text-stone-400",
  none: "bg-neutral-200/60 border-neutral-400 text-neutral-600 dark:bg-neutral-700/40 dark:border-neutral-500 dark:text-neutral-300",
} as const;

export { MONTH_NAMES, DAY_NAMES, CALENDER_PRIORITY_COLORS };
