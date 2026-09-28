"use client";

import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTaskSortsStore } from "../../stores/useTaskSortsStore";
import { SortField, SortOrder, UsedFor } from "./sort.type";

function SortRowField({
  sortField,
  withLabel,
  usedFor = "table",
}: {
  sortField: SortField;
  withLabel?: boolean;
  usedFor?: UsedFor;
}) {
  const {
    tableSorts,
    boardSorts,
    listSorts,
    setTableSorts,
    setBoardSorts,
    setListSorts,
  } = useTaskSortsStore();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleSorting = function (sortValue: SortOrder) {
    const params = new URLSearchParams(searchParams);
    if (sortValue === "") params.delete(sortField);
    else params.set(sortField, sortValue);

    if (usedFor === "table")
      setTableSorts({ ...tableSorts, [sortField]: sortValue });
    else if (usedFor === "board")
      setBoardSorts({ ...boardSorts, [sortField]: sortValue });
    else if (usedFor === "list")
      setListSorts({ ...listSorts, [sortField]: sortValue });

    replace(`${pathname}?${params.toString()}`);
  };

  const iconSize = 3;
  return (
    <>
      {!searchParams.get(sortField) && (
        <span
          className={
            withLabel ? "flex w-full items-center gap-1" : "h-fit w-fit"
          }
          onClick={() => handleSorting("asc")}
        >
          <ButtonIcon
            icon="sort"
            size={iconSize}
            padding="small"
            ariaLabel="sort button"
          />
          {withLabel && <span className="capitalize">{sortField}</span>}
        </span>
      )}
      {searchParams.get(sortField) === "asc" && (
        <span
          className={
            withLabel ? "flex w-full items-center gap-1" : "h-fit w-fit"
          }
          onClick={() => handleSorting("desc")}
        >
          <ButtonIcon
            icon="arrowUp"
            size={iconSize}
            padding="small"
            iconColor="fill-blue-400"
            bgColor="bg-blue-500/20"
            bgHoverColor="hover:bg-blue-700/20 active:bg-blue-700/20"
            ariaLabel="sort asc"
          />
          {withLabel && <span className="capitalize">{sortField}</span>}
        </span>
      )}
      {searchParams.get(sortField) === "desc" && (
        <span
          className={
            withLabel ? "flex w-full items-center gap-1" : "h-fit w-fit"
          }
          onClick={() => handleSorting("")}
        >
          <ButtonIcon
            icon="arrowDown"
            size={iconSize}
            padding="small"
            iconColor="fill-blue-300"
            bgColor="bg-blue-500/20"
            bgHoverColor="hover:bg-blue-700/20 active:bg-blue-700/20"
            ariaLabel="sort asc"
          />
          {withLabel && <span className="capitalize">{sortField}</span>}
        </span>
      )}
    </>
  );
}

export default SortRowField;
