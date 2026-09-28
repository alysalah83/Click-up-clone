import ListIdDataLayer from "@/features/list/components/ListIdDataLayer";
import TasksLoadingSkeleton from "@/features/task/components/TasksLoadingSkeleton";
import { Suspense } from "react";

function ListIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ listId: string }>;
}) {
  return (
    <Suspense fallback={<TasksLoadingSkeleton />}>
      <ListIdDataLayer paramsPromise={params}>{children}</ListIdDataLayer>
    </Suspense>
  );
}

export default ListIdLayout;
