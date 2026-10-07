import EmptySpaces from "@/features/workspace/components/EmptySpaces";
import ListViewSkeleton from "@/features/list/components/ListViewSkeleton";
import { workspaceServices } from "@/features/workspace/services/workspace.service";
import { ReactNode, Suspense } from "react";

async function WorkspaceGate({ children }: { children: ReactNode }) {
  const workspaceCount = await workspaceServices.getWorkspacesCount();

  if (workspaceCount === 0) return <EmptySpaces />;

  return <>{children}</>;
}

// The workspace check gets its own boundary so entering a list from another
// section shows the list skeleton right away, not the home spinner first.
function ListsLayout({ children }: { children: Readonly<ReactNode> }) {
  return (
    <Suspense fallback={<ListViewSkeleton />}>
      <WorkspaceGate>{children}</WorkspaceGate>
    </Suspense>
  );
}

export default ListsLayout;
