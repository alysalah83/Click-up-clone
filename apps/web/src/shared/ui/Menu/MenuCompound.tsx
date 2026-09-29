"use client";

import { Popover } from "radix-ui";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { MENU_MARGIN } from "./Menu.const";
import { cn } from "@/shared/lib/utils/cn";

interface MenuContextValues {
  isOpened: boolean;
  toggleMenu: () => void;
  menuMargin: number;
}

interface MenuProps {
  children: ReactNode;
  menuMargin?: number;
  outerIsOpen?: boolean;
  outerSetIsOpen?: Dispatch<SetStateAction<boolean>>;
}

const MenuContext = createContext<MenuContextValues | null>(null);

function Menu({ children, menuMargin = MENU_MARGIN, outerIsOpen = false, outerSetIsOpen }: MenuProps) {
  const [innerIsOpen, setInnerIsOpen] = useState(outerIsOpen);
  const isControlled = outerSetIsOpen !== undefined;
  const isOpened = isControlled ? outerIsOpen : innerIsOpen;

  const setOpen = (open: boolean) => {
    if (isControlled) outerSetIsOpen(open);
    else setInnerIsOpen(open);
  };
  const toggleMenu = () => setOpen(!isOpened);

  return (
    <MenuContext value={{ isOpened, toggleMenu, menuMargin }}>
      <Popover.Root open={isOpened} onOpenChange={setOpen}>
        {children}
      </Popover.Root>
    </MenuContext>
  );
}

function MenuTrigger({ children, containerClasses }: { children: ReactNode; containerClasses?: string }) {
  // A wrapper div (not asChild on the child) because children are often
  // components that do not forward refs (ButtonIcon, Avatar, StatusBadge).
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Radix restores focus by calling .focus() on the trigger element, which is
  // this wrapper div. A plain div without a tabindex cannot receive focus (in
  // real browsers, not just jsdom), so give it tabIndex={-1} (script-focusable,
  // not tab-reachable — no double tab stop) and redirect that programmatic
  // focus to the real interactive descendant (the button/link inside).
  return (
    <Popover.Trigger asChild>
      <div
        ref={wrapperRef}
        tabIndex={-1}
        className={cn(containerClasses, "outline-none")}
        onFocus={(e) => {
          if (e.target !== wrapperRef.current) return;
          wrapperRef.current
            ?.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
            ?.focus();
        }}
      >
        {children}
      </div>
    </Popover.Trigger>
  );
}

function MenuContent({ children }: { children: ReactNode }) {
  const { menuMargin } = useMenu();
  return (
    <Popover.Portal>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={menuMargin}
        collisionPadding={8}
        onClick={(e) => e.stopPropagation()}
        onCloseAutoFocus={(e) => {
          // Radix's default behavior focuses this menu's trigger when the
          // content unmounts. That's correct for Escape / item-removal, but
          // when an item inside this menu opens another menu (e.g. an
          // "options" item that opens an "avatar picker" and then closes
          // itself), focus has already moved into that other, newly-opened
          // menu. Refocusing our trigger would steal focus away from it,
          // and that other menu's onFocusOutside/onInteractOutside would
          // then dismiss it as a click/focus outside. Only restore focus to
          // our own trigger when nothing else already holds focus.
          const active = document.activeElement;
          if (active && active !== document.body) e.preventDefault();
        }}
        className={cn(
          "bg-popover text-popover-foreground z-50 rounded-lg text-sm shadow-md shadow-neutral-900/10",
          "origin-(--radix-popover-content-transform-origin) outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        )}
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
}

function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error("the menu context is being used out side of his scope");
  return context;
}

export { Menu, MenuTrigger, MenuContent, useMenu };
