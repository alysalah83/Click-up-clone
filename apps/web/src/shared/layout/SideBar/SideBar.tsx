"use client";

import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { ReactNode, useEffect } from "react";
import { useSideBarStore } from "./useSideNavStore";

function SideBar({ children }: { children: ReactNode }) {
  const { isSideBarOpened, setOpenSideBar, setCloseSideBar } =
    useSideBarStore();

  useEffect(() => {
    const mediaQuery: MediaQueryList = window.matchMedia("(width >= 1024px)");
    const isBigScreen = mediaQuery.matches;
    if (isBigScreen) setOpenSideBar();
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const isBigScreen = e.matches;
      isBigScreen ? setOpenSideBar() : setCloseSideBar();
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, [setOpenSideBar, setCloseSideBar]);

  return (
    <>
      <div
        onClick={setOpenSideBar}
        aria-label="open home sidebar"
        className={`bg-neutral-200text-neutral-700 fixed top-3 left-3 z-30 rounded-lg border border-neutral-300 shadow-sm transition sm:hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 ${
          isSideBarOpened ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ButtonIcon
          icon="sideBarRightCollapse"
          ariaLabel="open side nav button"
          withBg={false}
        />
      </div>
      <div
        onClick={setCloseSideBar}
        className={`fixed inset-0 z-30 bg-black/40 transition sm:hidden ${
          isSideBarOpened
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full max-w-[85vw] flex-col gap-4 overflow-x-hidden overflow-y-auto border-r border-neutral-300 bg-neutral-200 text-neutral-600 shadow-xl transition-transform duration-300 sm:static sm:max-w-none sm:translate-x-0 sm:rounded-tl-xl sm:rounded-bl-xl sm:shadow-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 ${
          isSideBarOpened
            ? "w-72 translate-x-0 p-4 sm:w-xs"
            : "w-72 -translate-x-full border-r-0 p-4 sm:w-0 sm:translate-x-0 sm:border-r-0 sm:p-0"
        }`}
      >
        <header className="flex items-center justify-between border-b border-neutral-300 pb-4 dark:border-neutral-700">
          <h3 className="text-xl font-semibold tracking-wider text-neutral-800 dark:text-neutral-200">
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
        <section className="flex flex-col gap-2">{children}</section>
      </aside>
    </>
  );
}

export default SideBar;
