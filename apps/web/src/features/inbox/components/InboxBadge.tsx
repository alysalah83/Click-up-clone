"use client";

import { Badge } from "@/components/ui/badge";
import { useUnreadCount } from "../hooks/useInbox";

function InboxBadge() {
  const { data } = useUnreadCount();
  if (!data?.count) return null;
  return (
    <Badge
      variant="destructive"
      aria-label={`${data.count} unread`}
      className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-4 font-bold"
    >
      {data.count > 99 ? "99+" : data.count}
    </Badge>
  );
}

export default InboxBadge;
