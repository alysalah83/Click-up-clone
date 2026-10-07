/** Extra tab on sprint lists: the burndown and velocity report. */
export const SPRINT_TAB = {
  icon: "dashboard",
  iconBgColor: "bg-violet-500",
  href: "/sprint",
  label: "Sprint report",
} as const;

export const HEADER_MENU = [
  {
    icon: "board",
    iconBgColor: "bg-blue-500",
    href: "/board",
    label: "Board",
  },
  {
    icon: "list",
    iconBgColor: "bg-emerald-500",
    href: "/table",
    label: "Table",
  },
  {
    icon: "list",
    iconBgColor: "bg-gray-500",
    href: "/list",
    label: "List",
  },
  {
    icon: "calendar",
    iconBgColor: "bg-orange-500",
    href: "/calendar",
    label: "Calendar",
  },
  {
    icon: "dashboard",
    iconBgColor: "bg-pink-500",
    href: "/timeline",
    label: "Timeline",
  },
  {
    icon: "team",
    iconBgColor: "bg-teal-500",
    href: "/workload",
    label: "Workload",
  },
  {
    icon: "mindmap",
    iconBgColor: "bg-indigo-500",
    href: "/mindmap",
    label: "Mind Map",
  },
  {
    icon: "form",
    iconBgColor: "bg-violet-500",
    href: "/form",
    label: "Form",
  },
  {
    icon: "exclamationMark",
    iconBgColor: "bg-gray-500",
    href: "/lists",
    label: "Lists Overview",
  },
] as const;
