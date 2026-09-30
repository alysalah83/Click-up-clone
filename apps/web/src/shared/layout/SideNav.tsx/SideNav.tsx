"use client";

import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState } from "react";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTip";
import { IconsMap } from "@/shared/icons/icons.type";
import { SIDE_NAV_ITEMS } from "./sideNav.const";
import SearchButton from "@/features/search/components/SearchButton";
import InboxBadge from "@/features/inbox/components/InboxBadge";
import { signOutUser } from "@/features/auth/actions/signout-user.action";

interface MenuItem {
  icon: IconsMap;
  label: string;
  href: string;
  includedRoutes?: string[];
}

function SideNav({ horizontal = false }: { horizontal?: boolean }) {
  const [_, action, isPending] = useActionState(signOutUser, null);
  return (
    <menu
      className={
        horizontal
          ? "flex w-full flex-wrap items-start justify-between gap-x-2 gap-y-3 rounded-xl bg-neutral-200/60 px-2 py-3 dark:bg-neutral-800/60"
          : "mr-2 flex w-fit flex-col items-center gap-6 rounded-2xl bg-neutral-100 px-1 py-4 shadow-xs md:px-2 dark:bg-neutral-900"
      }
    >
      <SearchButton />
      {SIDE_NAV_ITEMS.map((item) => (
        <SideMenuLink menuItem={item} key={item.href} />
      ))}

      <form
        className={`${horizontal ? "" : "mt-auto"} flex ${isPending ? "cursor-not-allowed" : "cursor-pointer"} flex-col items-center gap-1`}
        action={action}
      >
        <ToolTip>
          <ToolTipTrigger>
            <ButtonIcon
              icon="signOut"
              iconColor="fill-red-500 text-red-500"
              bgHoverColor="hover:bg-red-500/20 active:bg-red-500/20"
              padding="large"
              size={6}
              type="primary"
              ariaLabel={`sign out button`}
              disabled={isPending}
              btnType="submit"
              disabledIconColor="filled-red-700 text-red-700"
            />
          </ToolTipTrigger>
          <ToolTipMessage>Sign out</ToolTipMessage>
        </ToolTip>
      </form>
    </menu>
  );
}

function SideMenuLink({ menuItem }: { menuItem: MenuItem }) {
  const { icon, label, href, includedRoutes } = menuItem;
  const pathname = usePathname();
  let isActive = false;

  if (pathname === href) isActive = true;
  else if (includedRoutes)
    isActive = includedRoutes.some((path) => pathname.includes(path));

  return (
    <li className="relative">
      {href === "/home/inbox" && <InboxBadge />}
      <Link
        href={href}
        aria-label={`${label} button`}
        aria-current={isActive ? "page" : undefined}
        className="flex min-w-11 flex-col items-center gap-1 py-1"
      >
        <ButtonIcon
          icon={icon}
          size={6}
          type="primary"
          isActive={isActive}
          ariaLabel={`${label} button`}
          asDecoration
        />
        <span className="text-xs font-medium capitalize md:font-bold">
          {label}
        </span>
      </Link>
    </li>
  );
}

export default SideNav;
