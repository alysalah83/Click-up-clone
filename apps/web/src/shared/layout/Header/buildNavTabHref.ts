import { LIST_ID_RESERVED_ROUTES } from "@/shared/constants/layout";

type Sorts = Record<string, string>;

/**
 * Resolves the list a header tab should point to: the list in the URL when on a
 * list page, otherwise the latest created list. Returns undefined when neither is
 * a real id (e.g. on /home/dashboard for a user with no lists yet, where the
 * latest-list request resolves to null).
 */
export function resolveNavListId(
  routeListId: string | undefined,
  latestListId: string | null | undefined,
): string | undefined {
  const isRealId = (id: string | null | undefined): id is string =>
    !!id && !LIST_ID_RESERVED_ROUTES.has(id);

  if (isRealId(routeListId)) return routeListId;
  if (isRealId(latestListId)) return latestListId;
  return undefined;
}

/**
 * Builds a header tab href. List-scoped tabs return null when there is no list id,
 * so the caller renders a disabled tab instead of a `/home/lists/undefined/...` link.
 */
export function buildNavTabHref({
  href,
  listId,
  sorts,
}: {
  href: string;
  listId: string | undefined;
  sorts?: Sorts;
}): string | null {
  if (href === "/lists") return `/home${href}`;
  if (!listId) return null;

  const base = `/home/lists/${listId}${href}`;
  if (!sorts) return base;

  const params = new URLSearchParams();
  Object.entries(sorts).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
