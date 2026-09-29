import { ButtonWithIconLabel } from "@/shared/ui/Button";
import { HEADER_MENU } from "./Header.const";
import { usePathname } from "next/navigation";
import { List } from "@/features/list/types";
import { useCallback, useEffect, useRef } from "react";

function NavButtons({
  latestListIdPromise,
}: {
  latestListIdPromise: Promise<{ id: List["id"] } | undefined>;
}) {
  const pathname = usePathname();
  const itemRefs = useRef<HTMLAnchorElement[]>([]);
  const pillRef = useRef<HTMLSpanElement>(null);

  const activeItemIndex = HEADER_MENU.findIndex((item) =>
    pathname.endsWith(item.href),
  );

  const movePill = useCallback((index: number, isActive: boolean) => {
    const ele = itemRefs.current[index];
    const pill = pillRef.current;
    if (!ele || !pill) return;

    pill.style.left = `${ele.offsetLeft}px`;
    pill.style.width = `${ele.offsetWidth}px`;
    pill.style.height = isActive ? `calc(100% - 6px)` : `calc(100% - 8px)`;
    pill.classList.toggle("rounded-t-lg", isActive);
    pill.classList.toggle("rounded-lg", !isActive);
  }, []);

  useEffect(() => {
    movePill(activeItemIndex, true);
    // The tabs scroll horizontally instead of wrapping, so re-measure on resize.
    const handleResize = () => movePill(activeItemIndex, true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeItemIndex, movePill]);

  return (
    <menu
      className="relative flex max-w-full flex-nowrap gap-1 overflow-x-auto [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
      onPointerLeave={() => movePill(activeItemIndex, true)}
    >
      <span
        ref={pillRef}
        className="absolute top-0 bg-neutral-600/40 transition-all duration-300"
      />
      {HEADER_MENU.map((item, index) => (
        <ButtonWithIconLabel
          key={item.href}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          item={item}
          latestListIdPromise={latestListIdPromise}
          isActive={pathname.endsWith(item.href)}
          onHover={() => movePill(index, index === activeItemIndex)}
        />
      ))}
    </menu>
  );
}

export default NavButtons;
