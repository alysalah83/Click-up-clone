"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  use,
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
  return (
    <div
      onMouseEnter={() => setShowDropdown(true)}
      onPointerEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
      onPointerLeave={() => setShowDropdown(false)}
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
