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

  const list = await listServices.getList(listId).catch(() => notFound());
  if (!list) notFound();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["tasks", listId],
      queryFn: () => tasksService.getTasks(listId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["statuses", listId],
      queryFn: () => statusServices.getStatuses(listId),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

export default ListIdDataLayer;
