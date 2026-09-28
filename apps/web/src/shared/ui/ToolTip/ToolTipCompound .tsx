"use client";

import { TOOLTIP_MARGIN } from "./ToolTip.const";
import clsx from "clsx";
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

type Position = {
  top: number | null;
  left: number | null;
};

type ToolTipContext = {
  isHovered: boolean;
  shouldRender: boolean;
  mounted: boolean;
  position: Position;
  openToolTip: () => void;
  closeToolTip: () => void;
  setMounted: Dispatch<SetStateAction<boolean>>;
  parentToolTipRef: RefObject<HTMLElement | null>;
  messageRef: RefObject<HTMLDivElement | null>;
  setPosition: Dispatch<SetStateAction<Position>>;
};

interface MessageProps {
  children: ReactNode;
  messagePosition?: "top" | "right" | "bottom" | "left";
  withArrow?: boolean;
}

const ToolTipContext = createContext<ToolTipContext | null>(null);

function ToolTip({ children }: { children: ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const parentToolTipRef = useRef<HTMLElement | null>(null);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Position>({ top: null, left: null });
  const [mounted, setMounted] = useState(false);

  const openToolTip = () => {
    setIsHovered(true);
    setTimeout(() => setShouldRender(true), 10);
  };

  const closeToolTip = () => {
    setIsHovered(false);
    setShouldRender(false);
  };

  return (
    <ToolTipContext
      value={{
        isHovered,
        shouldRender,
        openToolTip,
        closeToolTip,
        parentToolTipRef,
        messageRef,
        position,
        setPosition,
        mounted,
        setMounted,
      }}
    >
      {children}
    </ToolTipContext>
  );
}

function useToolTip() {
  const values = use(ToolTipContext);
  if (!values)
    throw new Error("tooltip context is been used outside of its scope");
  return values;
}

function ToolTipMessage({
  children,
  messagePosition = "top",
  withArrow = true,
}: MessageProps) {
  const {
    isHovered: visible,
    parentToolTipRef,
    messageRef,
    position,
    setPosition,
    mounted,
    setMounted,
    shouldRender,
  } = useToolTip();

  useEffect(() => setMounted(true), [setMounted]);

  useEffect(() => {
    if (!parentToolTipRef?.current || !messageRef?.current || !visible) return;

    const triggerRect = parentToolTipRef.current.getBoundingClientRect();
    const toolTipRect = messageRef.current.getBoundingClientRect();

    let top: number;
    let left: number;

    switch (messagePosition) {
      case "top":
        top =
          triggerRect.top +
          window.scrollY -
          toolTipRect.height -
          TOOLTIP_MARGIN;
        left =
          triggerRect.left +
          window.scrollX +
          (triggerRect.width - toolTipRect.width) / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + window.scrollY + TOOLTIP_MARGIN;
        left =
          triggerRect.left +
          window.scrollX +
          (triggerRect.width - toolTipRect.width) / 2;
        break;
      case "left":
        top =
          triggerRect.top +
          window.scrollY +
          (triggerRect.height - toolTipRect.height) / 2;
        left =
          triggerRect.left +
          window.scrollX -
          toolTipRect.width -
          TOOLTIP_MARGIN;
        break;
      case "right":
        top =
          triggerRect.top +
          window.scrollY +
          (triggerRect.height - toolTipRect.height) / 2;
        left = triggerRect.right + window.scrollX + TOOLTIP_MARGIN;
        break;
    }

    setPosition({ top, left });
  }, [parentToolTipRef, messageRef, visible, setPosition, messagePosition]);

  if (!mounted || !visible) return null;

  const toolTipClasses = clsx(
    "flex",
    shouldRender
      ? "visible opacity-100  transition-opacity duration-150 delay-500"
      : "invisible opacity-0",
    {
      "flex-col": messagePosition === "top",
      "flex-row-reverse": messagePosition === "right",
      "flex-col-reverse": messagePosition === "bottom",
      "flex-row": messagePosition === "left",
    },
  );

  let arrowClasses;
  if (withArrow)
    arrowClasses = clsx("h-0 w-0 self-center", {
      "border-t-[6px] border-r-[6px] border-l-[6px] border-t-neutral-300 dark:border-t-neutral-700 border-r-transparent border-l-transparent":
        messagePosition === "top",
      "border-t-[6px] border-b-[6px] border-l-[6px] border-l-neutral-300 dark:border-l-neutral-700 border-t-transparent border-b-transparent":
        messagePosition === "left",
      "border-b-[6px] border-r-[6px] border-l-[6px] border-b-neutral-300 dark:border-b-neutral-700 border-r-transparent border-l-transparent":
        messagePosition === "bottom",
      "border-t-[6px] border-b-[6px] border-r-[6px] border-r-neutral-300 dark:border-r-neutral-700 border-t-transparent border-b-transparent":
        messagePosition === "right",
    });

  const isVisible = !!position.top && !!position.left;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: position.top ?? 0,
        left: position.left ?? 0,
        zIndex: 99999,
        pointerEvents: "none",
        visibility: isVisible ? "visible" : "hidden",
      }}
      ref={messageRef}
      className={toolTipClasses}
    >
      <span className="max-w-xs overflow-hidden rounded-lg bg-neutral-300 px-3 py-2 text-xs font-medium tracking-wide text-ellipsis whitespace-nowrap shadow-lg dark:bg-neutral-700">
        {children}
      </span>
      {withArrow && <span className={arrowClasses} role="tooltip arrow" />}
    </div>,
    document.body,
  );
}

function ToolTipTrigger({ children }: { children: ReactNode }) {
  const { openToolTip, closeToolTip, parentToolTipRef } = useToolTip();

  return (
    <span
      onMouseEnter={openToolTip}
      onMouseLeave={closeToolTip}
      onTouchStart={openToolTip}
      onTouchEnd={closeToolTip}
      ref={parentToolTipRef}
      className="inline-block"
      role="tooltip"
    >
      {children}
    </span>
  );
}

export { ToolTip, ToolTipTrigger, ToolTipMessage, useToolTip };
