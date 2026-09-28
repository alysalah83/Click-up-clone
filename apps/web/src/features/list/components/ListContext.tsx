"use client";

import { createContext, ReactNode, use, useCallback, useState } from "react";
import { List } from "../types";

interface ListValues {
  workspaceId: string;
  list: List;
  isRenameOpen: boolean;
  handleToggleIsRenameOpen: () => void;
}

interface ListProviderProps {
  children: ReactNode;
  workspaceId: string;
  list: List;
}

const ListContext = createContext<ListValues | null>(null);

function ListProvider({ children, workspaceId, list }: ListProviderProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const handleToggleIsRenameOpen = useCallback(
    () => setIsRenameOpen((cur) => !cur),
    [],
  );

  return (
    <ListContext
      value={{ workspaceId, list, isRenameOpen, handleToggleIsRenameOpen }}
    >
      {children}
    </ListContext>
  );
}

export function useList() {
  const values = use(ListContext);
  if (!values)
    throw new Error("List context is being used outside of his scope");
  return values;
}

export default ListProvider;
