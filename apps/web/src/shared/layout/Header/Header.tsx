"use client";

import ButtonIcon from "../../ui/Button/ButtonIcon";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "../../ui/ToolTip/ToolTipCompound ";
import UserLogo from "@/features/auth/components/UserLogo";
import { useSideBarStore } from "../SideBar/useSideNavStore";
import { UserWithoutPassword } from "@/features/auth/types";
import { List } from "@/features/list/types";
import ThemeButton from "./ThemeButton";
import HeaderFeatures from "./HeaderFeatures";
import NavButtons from "./NavButtons";

function Header({
  userPromise,
  latestListIdPromise,
}: {
  userPromise: Promise<UserWithoutPassword | undefined>;
  latestListIdPromise: Promise<{ id: List["id"] } | undefined>;
}) {
  const { isSideBarOpened, setOpenSideBar } = useSideBarStore();

  return (
    <header
      className={`flex flex-col gap-3 border-b px-3 pt-3 sm:px-4 sm:pt-4 ${
        !isSideBarOpened ? "sm:rounded-tl-xl" : ""
      } border-neutral-300 dark:border-neutral-700`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {!isSideBarOpened && (
            <ToolTip>
              <ToolTipMessage messagePosition="right">
                Open sidebar
              </ToolTipMessage>
              <ToolTipTrigger>
                <ButtonIcon
                  icon="sideBarRightCollapse"
                  onClick={setOpenSideBar}
                  ariaLabel="open side nav button"
                  withBg={true}
                />
              </ToolTipTrigger>
            </ToolTip>
          )}
          <ButtonIcon
            icon="list"
            ariaLabel="project list item"
            size={4.5}
            withBg={true}
            padding="large"
          />
          <h4 className="truncate text-sm font-bold capitalize">Workload</h4>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeButton />
          <UserLogo userPromise={userPromise} />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <NavButtons latestListIdPromise={latestListIdPromise} />
        <HeaderFeatures />
      </div>
    </header>
  );
}

export default Header;
