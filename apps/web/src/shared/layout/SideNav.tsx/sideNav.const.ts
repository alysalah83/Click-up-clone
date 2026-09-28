import { IconsMap } from "@/shared/icons/icons.type";

export const SIDE_NAV_ITEMS = [
  {
    icon: "home" as IconsMap,
    label: "Home",
    href: "/home",
    includedRoutes: ["/board", "/table", "/list", "/home/lists"],
  },
  {
    icon: "dashboard" as IconsMap,
    label: "DashBoard",
    href: "/home/dashboard",
  },
  {
    icon: "paintBrush" as IconsMap,
    label: "Whiteboard",
    href: "/home/whiteboard",
  },
];
