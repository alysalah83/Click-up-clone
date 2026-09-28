import EmptySpaces from "@/features/workspace/components/EmptySpaces";
import { workspaceServices } from "@/features/workspace/services/workspace.service";
import { ReactNode } from "react";

async function ListsLayout({ children }: { children: Readonly<ReactNode> }) {
  const workspaceCount = await workspaceServices.getWorkspacesCount();

  if (workspaceCount === 0) return <EmptySpaces />;

  return <>{children}</>;
}

export default ListsLayout;
