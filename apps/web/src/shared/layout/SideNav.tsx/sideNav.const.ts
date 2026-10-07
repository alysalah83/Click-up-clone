import { IconsMap } from "@/shared/icons/icons.type";

export const SIDE_NAV_ITEMS = [
  {
    icon: "home" as IconsMap,
    label: "Home",
    href: "/home/my-work",
  },
  {
    icon: "inbox" as IconsMap,
    label: "Inbox",
    href: "/home/inbox",
  },
  {
    icon: "list" as IconsMap,
    label: "Lists",
    href: "/home/lists",
  },
  {
    icon: "dashboard" as IconsMap,
    label: "DashBoard",
    href: "/home/dashboard",
  },
  {
    icon: "bullEye" as IconsMap,
    label: "Goals",
    href: "/home/goals",
  },
  {
    icon: "doc" as IconsMap,
    label: "Docs",
    href: "/home/docs",
  },
  {
    icon: "chat" as IconsMap,
    label: "Chat",
    href: "/home/chat",
  },
  {
    icon: "team" as IconsMap,
    label: "Teams",
    href: "/home/teams",
  },
  {
    icon: "paintBrush" as IconsMap,
    label: "Whiteboards",
    href: "/home/whiteboards",
    // The legacy /home/whiteboard route redirects into this section.
    includedRoutes: ["/home/whiteboard"],
  },
];
