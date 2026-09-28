"use client";

import { ICONS_MAP } from "@/shared/icons/icons-map";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LIST_ID_RESERVED_ROUTES } from "@/shared/constants/layout";
import { memo, use } from "react";
import { List } from "@/features/list/types";
import { IconsMap } from "@/shared/icons/icons.type";
import { useTaskSortsStore } from "@/features/task/stores/useTaskSortsStore";

interface ButtonWithIconLabelProps {
  item: {
    icon: IconsMap;
    iconBgColor: string;
    label: string;
    href: string;
  };
  isActive: boolean;
  latestListIdPromise: Promise<{ id: List["id"] } | undefined>;
  onHover: () => void;
  ref: (ele: HTMLButtonElement) => void;
}

function ButtonWithIconLabel({
  item,
  isActive,
  latestListIdPromise,
  onHover,
  ref,
}: ButtonWithIconLabelProps) {
  const { listId } = useParams<{ listId: string }>();
  let newListId: string | undefined;
  const isHavingReservedListId = LIST_ID_RESERVED_ROUTES.has(listId);
  if (isHavingReservedListId) {
    const latestListIdObj = use(latestListIdPromise);
    const latestListId = latestListIdObj?.id;
    newListId = latestListId || undefined;
  } else newListId = listId;

  const { icon, iconBgColor, label, href } = item;
  const Icon = ICONS_MAP[icon];

  const { boardSorts, tableSorts, listSorts } = useTaskSortsStore();
  const isTable = item.label === "Table";
  const isBoard = item.label === "Board";
  const isList = item.label === "List";
  const isListsOverview = item.label === "Lists Overview";

  let linkHref: string;
  if (isTable) {
    const tableSearchParams = new URLSearchParams();
    Object.entries(tableSorts).forEach(([key, value]) => {
      if (value) tableSearchParams.set(key, value);
    });
    linkHref = `/home/lists/${newListId}${href}?${tableSearchParams.toString()}`;
  } else if (isBoard) {
    const boardSearchParams = new URLSearchParams();
    Object.entries(boardSorts).forEach(([key, value]) => {
      if (value) boardSearchParams.set(key, value);
    });
    linkHref = `/home/lists/${newListId}${href}?${boardSearchParams.toString()}`;
  } else if (isList) {
    const listSearchParams = new URLSearchParams();
    Object.entries(listSorts).forEach(([key, value]) => {
      if (value) listSearchParams.set(key, value);
    });
    linkHref = `/home/lists/${newListId}${href}?${listSearchParams.toString()}`;
  } else if (isListsOverview) linkHref = `/home${href}`;
  else linkHref = `/home/lists/${newListId}${href}`;

  return (
    <Link href={linkHref} className="z-20">
      <button
        ref={(ele) => {
          if (ele) ref(ele);
        }}
        type="button"
        aria-label={`${label} button`}
        onPointerOver={onHover}
        className={`flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs ${
          isActive
            ? "rounded-tl-lg rounded-tr-lg border-b-2 border-neutral-300 text-neutral-950 sm:rounded-tl-lg sm:rounded-tr-lg sm:border-x-0 sm:border-t-0 sm:pb-2 dark:text-neutral-50 dark:sm:border-neutral-50"
            : "text-neutral-500 sm:mb-2 dark:text-neutral-300"
        } cursor-pointer transition`}
      >
        <span className={`rounded-sm p-0.5 ${iconBgColor}`}>
          <Icon className="h-3 w-3 fill-neutral-50" />
        </span>
        <span className="font-medium capitalize">{label}</span>
      </button>
    </Link>
  );
}

export default ButtonWithIconLabel;
