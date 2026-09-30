"use client";

import { useUnreadCount } from "../hooks/useInbox";

function InboxBadge() {
  const { data } = useUnreadCount();
  if (!data?.count) return null;
  return (
    <span
      aria-label={`${data.count} unread`}
      className="absolute -top-1 -right-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 font-bold text-white"
    >
      {data.count > 99 ? "99+" : data.count}
    </span>
  );
}

export default InboxBadge;
