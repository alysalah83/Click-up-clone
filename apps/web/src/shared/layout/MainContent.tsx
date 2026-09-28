"use client";

import { ReactNode } from "react";
import { useSideBarStore } from "./SideBar/useSideNavStore";

function MainContent({ children }: { children: ReactNode }) {
  const { isSideBarOpened } = useSideBarStore();
  return (
    <section
      className={`dark:bg-neutral-925 flex min-h-screen w-full min-w-0 flex-1 flex-col overflow-hidden bg-neutral-100 sm:min-h-0 ${
        !isSideBarOpened ? "sm:rounded-tl-xl sm:rounded-bl-xl" : ""
      } sm:rounded-tr-xl sm:rounded-br-xl`}
    >
      {children}
    </section>
  );
}

export default MainContent;
