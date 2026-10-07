"use client";

import ButtonIcon from "../../ui/Button/ButtonIcon";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTip";
import UserLogo from "@/features/auth/components/UserLogo";
import { useSideBarStore } from "../SideBar/useSideNavStore";
import { UserWithoutPassword } from "@/features/auth/types";
import { List } from "@/features/list/types";
import ThemeButton from "./ThemeButton";
import HeaderFeatures from "./HeaderFeatures";
import NavButtons from "./NavButtons";
import HeaderTitle from "./HeaderTitle";
import SprintBar from "@/features/sprint/components/SprintBar";
import { useParams, usePathname } from "next/navigation";
import SharePopover from "@/features/share/components/SharePopover";
import { LIST_ID_RESERVED_ROUTES } from "@/shared/constants/layout";

function Header({
  userPromise,
  latestListIdPromise,
}: {
  userPromise: Promise<UserWithoutPassword | undefined>;
  latestListIdPromise: Promise<{ id: List["id"] } | null>;
}) {
  const { isSideBarOpened, setOpenSideBar } = useSideBarStore();
  const showViewTabs = usePathname().startsWith("/home/lists");
  const { listId } = useParams<{ listId?: string }>();
  const isListPage = showViewTabs && !!listId && !LIST_ID_RESERVED_ROUTES.has(listId);

  return (
    <header
      className={`flex flex-col gap-3 border-b px-3 pt-3 sm:px-4 sm:pt-4 ${
        !isSideBarOpened ? "sm:rounded-tl-xl" : ""
      } ${showViewTabs ? "" : "pb-3 sm:pb-4"} border-neutral-200 dark:border-neutral-800`}
    >
      <div className="flex flex-nowrap items-center justify-between gap-2 sm:flex-wrap sm:gap-3">
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
            ariaLabel="current page"
            size={4.5}
            padding="large"
            asDecoration
          />
          <HeaderTitle />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {isListPage && (
            <SharePopover
              key={listId}
              target={{ resourceType: "list", resourceId: listId }}
              className="mr-1"
            />
          )}
          <ThemeButton />
          <UserLogo userPromise={userPromise} />
        </div>
      </div>
      {showViewTabs && <SprintBar />}
      {showViewTabs && (
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <NavButtons latestListIdPromise={latestListIdPromise} />
          <HeaderFeatures />
        </div>
      )}
    </header>
  );
}

export default Header;
