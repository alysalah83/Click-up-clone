import DateBtn from "./components/DateBtn";
import PriorityBtn from "./components/PriorityBtn";

export const ICON_SIZE = 3.5;

export const SKELTON_TASK_COUNT = 3;

export const BOARD_STATUS_BACKGROUND_COLOR = {
  red: "bg-red-400/20 dark:bg-red-800/20",
  neutral: "bg-neutral-300 dark:bg-neutral-900",
  amber: "bg-amber-300 dark:bg-amber-900",
  lime: "bg-lime-300 dark:bg-lime-900",
  green: "bg-green-300 dark:bg-green-900",
  emerald: "bg-emerald-300/20 dark:bg-emerald-900/20",
  teal: "bg-teal-300 dark:bg-teal-900",
  cyan: "bg-cyan-300 dark:bg-cyan-900",
  blue: "bg-blue-300 dark:bg-blue-900",
  indigo: "bg-indigo-300 dark:bg-indigo-900",
  violet: "bg-violet-300/20 dark:bg-violet-900/20",
  purple: "bg-purple-300 dark:bg-purple-900",
  gray: "bg-gray-300 dark:bg-gray-900",
  stone: "bg-stone-300 dark:bg-stone-900",
} as const;

export const FEATURE_COMPONENTS = {
  date: DateBtn,
  Priority: PriorityBtn,
} as const;
