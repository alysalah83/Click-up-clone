"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import { LIST_ID_RESERVED_ROUTES } from "@/shared/constants/layout";
import { List } from "@/features/list/types";
import { isSprintList, sprintRange } from "@/features/sprint/lib";
import SprintStateBadge from "@/features/sprint/components/SprintStateBadge";

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
  else if (pathname.startsWith("/home/whiteboard")) title = "Whiteboards";
  else if (pathname.startsWith("/home/teams")) title = "Teams";
  else if (pathname.startsWith("/home/my-work")) title = "My Work";
  else if (pathname.startsWith("/home/inbox")) title = "Inbox";
  else if (pathname.startsWith("/home/docs")) title = "Docs";
  else if (pathname.startsWith("/home/goals")) title = "Goals";
  else if (pathname.startsWith("/home/templates")) title = "Templates";
  else if (pathname === "/home/lists") title = "Lists Overview";
  else if (isListPage && list?.name) title = list.name;

  if (isListPage && isSprintList(list))
    return (
      <div className="flex min-w-0 items-center gap-2">
        <h4 className="truncate text-sm font-bold capitalize">
          {title}
          <span className="ml-1.5 font-medium text-neutral-500 normal-case">
            · {sprintRange(list.sprintStart, list.sprintEnd)}
          </span>
        </h4>
        {list.sprintState && <SprintStateBadge state={list.sprintState} />}
      </div>
    );

  return <h4 className="truncate text-sm font-bold capitalize">{title}</h4>;
}

export default HeaderTitle;
