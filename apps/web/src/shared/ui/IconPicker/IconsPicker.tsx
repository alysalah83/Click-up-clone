import { useRef, useState } from "react";
import {
  ICONS_REGISTRY,
  ITEMS_PER_ROW,
  OVER_SCAN_ROWS,
  ROW_HEIGHT,
} from "./IconRegistry";
import { IconsRegistry } from "./types";
import { useVirtualizer } from "@tanstack/react-virtual";
import IconButton from "./IconButton";

function IconPicker({
  selectedIcon,
  setSelectedIcon,
}: {
  selectedIcon: IconsRegistry | null;
  setSelectedIcon: (icon: IconsRegistry) => void;
}) {
  const iconPickerContainerRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const iconsArr = Object.entries(ICONS_REGISTRY).filter(([iconName]) =>
    iconName.toLowerCase().includes(search.toLowerCase()),
  );

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(iconsArr.length / ITEMS_PER_ROW),
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => iconPickerContainerRef.current,
    overscan: OVER_SCAN_ROWS,
  });

  return (
    <div className="w-full px-3 py-2">
      {/* The search box sits above the scroll container so it stays visible
          while the (virtualized) icon grid scrolls. */}
      <input
        type="search"
        aria-label="Search icons"
        placeholder="Search icons"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          // A new filter shows a new list; start it from the top.
          if (iconPickerContainerRef.current)
            iconPickerContainerRef.current.scrollTop = 0;
        }}
        className="mb-2 w-full rounded-md border border-neutral-400 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
      />
      <div
        data-slot="icons-scroll"
        className="max-h-32 w-full overflow-y-auto"
        ref={iconPickerContainerRef}
      >
        {iconsArr.length === 0 ? (
          <p className="p-2 text-sm text-neutral-500">No icons found</p>
        ) : (
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * ITEMS_PER_ROW;
              const rowIcons = iconsArr.slice(
                startIndex,
                startIndex + ITEMS_PER_ROW,
              );

              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 top-0 flex w-full gap-1"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {rowIcons.map(([iconName, Icon]) => (
                    <IconButton
                      key={iconName}
                      iconName={iconName as IconsRegistry}
                      Icon={Icon}
                      isSelected={selectedIcon === iconName}
                      setSelectedIcon={setSelectedIcon}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default IconPicker;
