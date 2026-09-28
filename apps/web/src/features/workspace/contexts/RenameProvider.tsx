"use client";

import { createContext, use, useCallback, useMemo, useState } from "react";

interface RenameContextValues {
  isRenameOpen: boolean;
  handleToggleIsRenameOpen: () => void;
}

const RenameContext = createContext<RenameContextValues | null>(null);

function RenameProvider({ children }: { children: React.ReactNode }) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const handleToggleIsRenameOpen = useCallback(
    () => setIsRenameOpen((cur) => !cur),
    [],
  );

  const values = useMemo(
    () => ({ isRenameOpen, handleToggleIsRenameOpen }),
    [isRenameOpen, handleToggleIsRenameOpen],
  );
  return <RenameContext value={values}>{children}</RenameContext>;
}

export function useRename() {
  const values = use(RenameContext);
  if (!values)
    throw new Error("rename context is being used outside of his scope");
  return values;
}

export default RenameProvider;
