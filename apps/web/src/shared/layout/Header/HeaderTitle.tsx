"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import { LIST_ID_RESERVED_ROUTES } from "@/shared/constants/layout";
import { List } from "@/features/list/types";

/**
 * Title derived from the route. For a list page it reads the `["list", listId]`
 * query that ListIdDataLayer prefetches (and the rename action keeps fresh), so
 * no extra request is made; it falls back to "List" until that is available.
 */
function HeaderTitle() {
  const pathname = usePathname();
  const { listId } = useParams<{ listId?: string }>();
  const isListPage = !!listId && !LIST_ID_RESERVED_ROUTES.has(listId);

  const { data: list } = useQuery<List>({
    queryKey: ["list", listId],
    // Populated by hydration; never fetched from the client. `skipToken` (rather
    // than `enabled: false` alone) disables the query without tripping the
    // dev-only "No queryFn was passed" warning.
    queryFn: skipToken,
  });

  let title = "List";
  if (pathname.startsWith("/home/dashboard")) title = "Dashboard";
  else if (pathname.startsWith("/home/whiteboard")) title = "Whiteboard";
  else if (pathname.startsWith("/home/teams")) title = "Teams";
  else if (pathname === "/home/lists") title = "Lists Overview";
  else if (isListPage && list?.name) title = list.name;

  return <h4 className="truncate text-sm font-bold capitalize">{title}</h4>;
}

export default HeaderTitle;
