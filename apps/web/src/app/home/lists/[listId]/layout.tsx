import ListIdDataLayer from "@/features/list/components/ListIdDataLayer";
import ListViewSkeleton from "@/features/list/components/ListViewSkeleton";
import { Suspense } from "react";
import { TaskDetailHost } from "@/features/task/components/TaskDetailPanel";

function ListIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ listId: string }>;
}) {
  return (
    <Suspense fallback={<ListViewSkeleton />}>
      <ListIdDataLayer paramsPromise={params}>
        {children}
        <TaskDetailHost />
      </ListIdDataLayer>
    </Suspense>
  );
}

export default ListIdLayout;
