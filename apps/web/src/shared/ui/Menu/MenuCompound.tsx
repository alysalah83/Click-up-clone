"use client";

import { MENU_MARGIN } from "./Menu.const";
import {
  createContext,
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

interface MenuContextValues {
  menuMargin: number;
  positionCords: PositionCords;
  setPositionCords: Dispatch<SetStateAction<PositionCords>>;
  isOpened: boolean;
  mounted: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  toggleMenu: () => void;
  handleMounted: () => void;
}

interface PositionCords {
  top: number | null;
  left: number | null;
}

interface MenuProps {
  children: ReactNode;
  menuMargin?: number;
  outerIsOpen?: boolean;
  outerSetIsOpen?: Dispatch<SetStateAction<boolean>>;
}

const MenuContext = createContext<MenuContextValues | null>(null);

function Menu({
  children,
  menuMargin = MENU_MARGIN ?? 6,
  outerIsOpen = false,
  outerSetIsOpen,
}: MenuProps) {
  const [positionCords, setPositionCords] = useState<PositionCords>({
    top: null,
    left: null,
  });
  const [isOpened, setIsOpened] = useState(false);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => {
    outerSetIsOpen?.((cur) => !cur);
    setIsOpened((cur) => !cur);
  };
  const handleMounted = () => setMounted(true);

  useEffect(() => {
    setIsOpened(outerIsOpen);
  }, [outerIsOpen]);

  return (
    <MenuContext
      value={{
        menuMargin,
        positionCords,
        setPositionCords,
        isOpened,
        toggleMenu,
        mounted,
        triggerRef,
        menuRef,
        handleMounted,
      }}
    >
      {children}
    </MenuContext>
  );
}

function useMenu() {
  const values = use(MenuContext);
  if (!values)
    throw new Error("the menu context is being used out side of his scope");
  return values;
}

function Overlay() {
  const { toggleMenu } = useMenu();

  return (
    <div
      className="absolute inset-0 z-40 overflow-x-hidden overflow-y-hidden"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target !== e.currentTarget) return;
        toggleMenu();
      }}
    />
  );
}

function MenuContent({ children }: { children: ReactNode }) {
  const {
    positionCords,
    setPositionCords,
    isOpened,
    mounted,
    triggerRef,
    menuRef,
    handleMounted,
    menuMargin,
  } = useMenu();

  useEffect(() => handleMounted(), [handleMounted]);

  useEffect(() => {
    if (!triggerRef?.current || !menuRef?.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();

    const pageHight = window.innerHeight + window.scrollY;
    const pageWidth = window.innerWidth + window.scrollX;
    let top = triggerRect.bottom + window.scrollY + menuMargin;
    let left = triggerRect.left + window.scrollX;

    if (pageHight - Math.abs(top) < menuRect.height)
      top = triggerRect.top + window.scrollY - menuRect.height - menuMargin;

    if (pageHight - Math.abs(top) < menuRect.height)
      top = pageHight - menuRect.height + window.scrollY - menuMargin;

    if (pageWidth - left < menuRect.width)
      left = pageWidth - menuRect.width + window.scrollX - menuMargin;

    setPositionCords({ top, left });
  }, [triggerRef, menuRef, setPositionCords, isOpened, menuMargin]);

  if (!mounted) return null;

  const hasPosition =
    positionCords.top !== null && positionCords.left !== null;

  return createPortal(
    <>
      {isOpened && <Overlay />}
      <AnimatePresence>
        {isOpened && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              top: positionCords.top ?? 0,
              left: positionCords.left ?? 0,
              visibility: hasPosition ? "visible" : "hidden",
              transformOrigin: "top left",
            }}
            className="absolute z-50 rounded-lg bg-neutral-300 text-sm text-neutral-800 shadow-md shadow-neutral-900/10 dark:bg-neutral-800 dark:text-neutral-200"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}

function MenuTrigger({
  children,
  containerClasses,
}: {
  children: ReactNode;
  containerClasses?: string;
}) {
  const { toggleMenu, triggerRef } = useMenu();

  return (
    <div className={containerClasses} onClick={toggleMenu} ref={triggerRef}>
      {children}
    </div>
  );
}

export { Menu, MenuTrigger, MenuContent, useMenu };
