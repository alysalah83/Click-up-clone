"use client";

import React, { createContext, use, useMemo } from "react";
import { Workspace } from "../types";

type WorkspaceProviderValues = Workspace;

const WorkspaceContext = createContext<WorkspaceProviderValues | null>(null);

function WorkspaceProvider({
  children,
  workspace,
}: {
  children: React.ReactNode;
  workspace: Workspace;
}) {
  const values = useMemo(() => ({ ...workspace }), [workspace]);
  return <WorkspaceContext value={values}>{children}</WorkspaceContext>;
}

export function useWorkspace() {
  const values = use(WorkspaceContext);
  if (!values)
    throw new Error("workspace context is being used outside of his scope");
  return values;
}

export default WorkspaceProvider;
