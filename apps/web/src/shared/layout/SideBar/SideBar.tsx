"use client";

import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { ReactNode, useEffect } from "react";
import SideNav from "../SideNav.tsx/SideNav";
import { usePathname } from "next/navigation";
import { useSideBarStore } from "./useSideNavStore";

function SideBar({ children }: { children: ReactNode }) {
  const { isSideBarOpened, setOpenSideBar, setCloseSideBar } =
    useSideBarStore();

  useEffect(() => {
    const mediaQuery: MediaQueryList = window.matchMedia("(width >= 1024px)");
    const isBigScreen = mediaQuery.matches;
    if (isBigScreen) setOpenSideBar();
    else if (window.innerWidth < 640) setCloseSideBar();
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const isBigScreen = e.matches;
      isBigScreen ? setOpenSideBar() : setCloseSideBar();
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, [setOpenSideBar, setCloseSideBar]);

  // On phones the sidebar is a drawer: close it after navigating.
  const pathname = usePathname();
  useEffect(() => {
    if (window.innerWidth < 640) setCloseSideBar();
  }, [pathname, setCloseSideBar]);

  return (
    <>
      <div
        onClick={setCloseSideBar}
        className={`fixed inset-0 z-30 bg-black/40 transition sm:hidden ${
          isSideBarOpened
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full max-w-[85vw] flex-col gap-4 overflow-x-hidden overflow-y-auto border-r border-neutral-200 bg-neutral-100 text-neutral-600 shadow-xl transition-transform duration-300 sm:static sm:max-w-none sm:translate-x-0 sm:rounded-tl-xl sm:rounded-bl-xl sm:shadow-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 ${
          isSideBarOpened
            ? "w-72 translate-x-0 p-4 sm:w-xs"
            : "w-72 -translate-x-full border-r-0 p-4 sm:w-0 sm:translate-x-0 sm:border-r-0 sm:p-0"
        }`}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <h3 className="text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
            Home
          </h3>
          <div className="flex items-center gap-2">
            <ButtonIcon icon="search" ariaLabel="search project button" />
            <ButtonIcon
              icon="sideBarLeftCollapse"
              onClick={setCloseSideBar}
              ariaLabel="close side nav button"
            />
          </div>
        </header>
        <div className="sm:hidden">
          <SideNav horizontal />
        </div>
        <section className="flex flex-col gap-2">{children}</section>
      </aside>
    </>
  );
}

export default SideBar;
