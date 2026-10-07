import { statusServices } from "@/features/status/services/status.service";
import { tasksService } from "@/features/task/services/task.service";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { listServices } from "../services/list.service";

async function ListIdDataLayer({
  paramsPromise,
  children,
}: {
  paramsPromise: Promise<{ listId: string }>;
  children: React.ReactNode;
}) {
  const { listId } = await paramsPromise;

  const queryClient = new QueryClient();
  // All three requests run together; the list lookup used to finish first and
  // hold back the other two. prefetchQuery never throws, so a missing list
  // still ends in notFound() below.
  const [list] = await Promise.all([
    listServices.getList(listId).catch(() => null),
    queryClient.prefetchQuery({
      queryKey: ["tasks", listId],
      queryFn: () => tasksService.getTasks(listId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["statuses", listId],
      queryFn: () => statusServices.getStatuses(listId),
    }),
  ]);
  if (!list) notFound();

  // Seed the client cache so the header can show the list name without a request.
  queryClient.setQueryData(["list", listId], list);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

export default ListIdDataLayer;
