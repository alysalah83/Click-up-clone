export const HIGHEST_ORDER = 100000;

export const DEFAULT_STATUS = [
  {
    name: "to do",
    icon: "circleDotted",
    iconColor: "neutral",
    bgColor: "neutral",
    order: 100,
    type: "open",
    isDefault: true,
  },
  {
    name: "in progress",
    icon: "inProgress",
    iconColor: "violet",
    bgColor: "violet",
    order: 200,
    type: "active",
    isDefault: true,
  },
  {
    name: "complete",
    icon: "complete",
    iconColor: "emerald",
    bgColor: "emerald",
    order: HIGHEST_ORDER,
    type: "done",
    isDefault: true,
  },
] as const;

/** Rows for `status: { createMany: { data } }` when creating a list. */
export const defaultStatusesFor = (userId: string) =>
  DEFAULT_STATUS.map((status) => ({ ...status, userId }));
