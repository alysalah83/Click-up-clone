"use client";

import { ICONS_MAP } from "@/shared/icons/icons-map";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LIST_ID_RESERVED_ROUTES } from "@/shared/constants/layout";
import { memo, use } from "react";
import { List } from "@/features/list/types";
import { IconsMap } from "@/shared/icons/icons.type";
import {
  NewSorts,
  useTaskSortsStore,
} from "@/features/task/stores/useTaskSortsStore";
import {
  buildNavTabHref,
  resolveNavListId,
} from "@/shared/layout/Header/buildNavTabHref";

interface ButtonWithIconLabelProps {
  item: {
    icon: IconsMap;
    iconBgColor: string;
    label: string;
    href: string;
  };
  isActive: boolean;
  latestListIdPromise: Promise<{ id: List["id"] } | null>;
  onHover: () => void;
  ref: (ele: HTMLAnchorElement) => void;
}

function ButtonWithIconLabel({
  item,
  isActive,
  latestListIdPromise,
  onHover,
  ref,
}: ButtonWithIconLabelProps) {
  const { listId } = useParams<{ listId?: string }>();
  // Off list pages (e.g. /home/dashboard) there is no listId param, so fall back
  // to the latest created list. That resolves to null for a user with no lists.
  const latestListId = LIST_ID_RESERVED_ROUTES.has(listId)
    ? use(latestListIdPromise)?.id
    : undefined;
  const navListId = resolveNavListId(listId, latestListId);

  const { icon, iconBgColor, label, href } = item;
  const Icon = ICONS_MAP[icon];

  const { boardSorts, tableSorts, listSorts } = useTaskSortsStore();
  const sortsByHref: Record<string, NewSorts | undefined> = {
    "/board": boardSorts,
    "/table": tableSorts,
    "/list": listSorts,
  };
  const linkHref = buildNavTabHref({
    href,
    listId: navListId,
    sorts: sortsByHref[href],
  });

  const className = `z-20 flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-1 text-[11px] sm:text-xs ${
    isActive
      ? "rounded-tl-lg rounded-tr-lg border-b-2 border-neutral-300 text-neutral-950 sm:rounded-tl-lg sm:rounded-tr-lg sm:border-x-0 sm:border-t-0 sm:pb-2 dark:text-neutral-50 dark:sm:border-neutral-50"
      : "text-neutral-500 sm:mb-2 dark:text-neutral-300"
  }`;
  const content = (
    <>
      <span className={`rounded-sm p-0.5 ${iconBgColor}`}>
        <Icon className="h-3 w-3 fill-neutral-50" />
      </span>
      <span className="font-medium capitalize">{label}</span>
    </>
  );

  // No list to point at yet: render a disabled tab instead of a broken link.
  if (!linkHref)
    return (
      <a
        ref={(ele) => {
          if (ele) ref(ele);
        }}
        aria-label={`${label} button`}
        aria-disabled="true"
        title="Create a list first"
        onPointerOver={onHover}
        className={`${className} cursor-not-allowed opacity-50`}
      >
        {content}
      </a>
    );

  return (
    <Link
      href={linkHref}
      ref={(ele) => {
        if (ele) ref(ele);
      }}
      aria-label={`${label} button`}
      aria-current={isActive ? "page" : undefined}
      onPointerOver={onHover}
      className={`${className} cursor-pointer transition`}
    >
      {content}
    </Link>
  );
}

export default ButtonWithIconLabel;
