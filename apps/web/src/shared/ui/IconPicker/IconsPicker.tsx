import { useRef } from "react";
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
  const iconsArr = Object.entries(ICONS_REGISTRY);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(iconsArr.length / ITEMS_PER_ROW),
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => iconPickerContainerRef.current,
    overscan: OVER_SCAN_ROWS,
  });

  return (
    <div
      className="max-h-44 w-full overflow-y-auto px-3 py-2"
      ref={iconPickerContainerRef}
    >
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
              className="absolute top-0 left-0 flex w-full gap-1"
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
    </div>
  );
}

export default IconPicker;
