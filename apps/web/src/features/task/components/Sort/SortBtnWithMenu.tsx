"use client";

import { Menu, MenuTrigger, MenuContent } from "@/shared/ui/Menu/MenuCompound";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Button } from "@/shared/ui/Button";
import { hoverElementClasses } from "@/shared/constants/styles";
import { usePathname } from "next/navigation";
import { SORT_FIELDS } from "./sort.consts";
import SortRowField from "./SortRowField";
import { UsedFor } from "./sort.type";

function SortBtnWithMenu({
  withSortStatusField = false,
}: {
  withSortStatusField?: boolean;
}) {
  const pathname = usePathname();
  const usedFor: UsedFor = pathname.endsWith("/calendar")
    ? "calendar"
    : pathname.endsWith("/list")
      ? "list"
      : pathname.endsWith("/table")
        ? "table"
        : "board";

  return (
    <Menu>
      <MenuTrigger>
        <Button
          size="smallWithMidPadding"
          rounded="large"
          type="primary"
          ariaLabel="sortButton"
          extraClasses="flex items-center gap-1"
        >
          <ICONS_MAP.sort className="size-3" />
          <span>Sort</span>
        </Button>
      </MenuTrigger>
      <MenuContent>
        <div className="flex min-w-48 flex-col gap-3 p-3">
          <h3 className="px-3 pt-1 text-sm font-medium text-neutral-700 dark:text-neutral-500">
            Sort By
          </h3>
          <ul className="text-base font-medium text-neutral-900 dark:text-neutral-300">
            {SORT_FIELDS.map((sortField) => {
              if (!withSortStatusField && sortField === "status") return;
              return (
                <li
                  className={`${hoverElementClasses} flex items-center gap-1 rounded-lg px-3 py-1 transition duration-300`}
                  key={sortField}
                >
                  <SortRowField
                    sortField={sortField}
                    withLabel={true}
                    usedFor={usedFor}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </MenuContent>
    </Menu>
  );
}

export default SortBtnWithMenu;
