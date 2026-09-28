export const hoverElementClasses =
  "cursor-pointer hover:bg-neutral-900/10 active:bg-neutral-900/10 dark:hover:bg-neutral-200/10 dark:active:bg-neutral-200/10";

export const hoverElementWithBgClasses = `bg-neutral-400/20 dark:bg-neutral-600/20 ${hoverElementClasses}`;

export const sizeClasses: Record<number, string> = {
  1: "h-1 w-1",
  2: "h-2 w-2",
  3: "h-3 w-3",
  3.5: "h-3.5 w-3.5",
  4: "h-4 w-4",
  4.5: "h-4.5 w-4.5",
  5: "h-5 w-5",
  5.5: "h-5.5 w-5.5",
  6: "h-5 w-5 md:h-6 md:w-6",
  7: "h-7 w-7",
  8: "h-8 w-8",
  9: "h-9 w-9",
  10: "h-10 w-10",
  11: "h-11 w-11",
  12: "h-12 w-12",
  14: "h-14 w-14",
  16: "h-16 w-16",
  20: "h-20 w-20",
} as const;
