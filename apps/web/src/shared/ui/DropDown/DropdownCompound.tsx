"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  use,
  useEffect,
  useRef,
  useState,
} from "react";

interface DropdownContextValues {
  showDropdown: boolean;
  setShowDropdown: Dispatch<SetStateAction<boolean>>;
  /** indicate whether the content will be children of the trigger element set to true if it is */
  toggleOnChildClick: boolean;
}

const DropdownContext = createContext<DropdownContextValues | null>(null);

function Dropdown({
  children,
  toggleOnChildClick = false,
}: {
  children: ReactNode;
  toggleOnChildClick?: boolean;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <DropdownContext
      value={{
        showDropdown,
        setShowDropdown,
        toggleOnChildClick,
      }}
    >
      {children}
    </DropdownContext>
  );
}

function DropdownTrigger({ children }: { children: ReactNode }) {
  const { setShowDropdown, toggleOnChildClick } = useDropdown();
  // Blur is resolved on the next macrotask instead of immediately: content
  // rendered inside the dropdown (Menu/Modal) is portaled to <body>, so a
  // DOM-containment check on relatedTarget cannot tell "focus moved to an
  // item of the open menu" from "focus left the dropdown". React bubbles
  // focus events from portals through this div, so a focus landing anywhere
  // in the React subtree (portals included) fires onFocus here and cancels
  // the pending close.
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPendingBlur = () => {
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };
  useEffect(() => cancelPendingBlur, []);

  return (
    <div
      onMouseEnter={() => setShowDropdown(true)}
      onPointerEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
      onPointerLeave={() => setShowDropdown(false)}
      onFocus={() => {
        cancelPendingBlur();
        setShowDropdown(true);
      }}
      onBlur={() => {
        cancelPendingBlur();
        blurTimeoutRef.current = setTimeout(() => {
          blurTimeoutRef.current = null;
          setShowDropdown(false);
        }, 0);
      }}
      onClick={(e) => {
        if (!toggleOnChildClick && e.target !== e.currentTarget) return;
        setShowDropdown((cur) => !cur);
      }}
      className="relative"
    >
      {children}
    </div>
  );
}

function DropdownMenu({ children }: { children: ReactNode }) {
  const { showDropdown } = useDropdown();

  if (!showDropdown) return null;

  return <div onClick={(e) => e.stopPropagation()}>{children}</div>;
}

function useDropdown() {
  const values = use(DropdownContext);
  if (!values)
    throw new Error("dropdown context is being used outside of his scope");
  return values;
}

export { Dropdown, DropdownTrigger, DropdownMenu };
