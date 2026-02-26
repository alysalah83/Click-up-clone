export const HIGHEST_ORDER = 100000;

export const DEFAULT_STATUS = [
  {
    name: "to do",
    icon: "circleDotted",
    iconColor: "neutral",
    bgColor: "neutral",
    order: 100,
  },
  {
    name: "in progress",
    icon: "inProgress",
    iconColor: "violet",
    bgColor: "violet",
    order: 200,
  },
  {
    name: "complete",
    icon: "complete",
    iconColor: "emerald",
    bgColor: "emerald",
    order: HIGHEST_ORDER,
  },
];
