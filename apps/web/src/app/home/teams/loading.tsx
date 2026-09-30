import { Skeleton } from "@/components/ui/skeleton";

function loading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 p-3 sm:p-4 lg:p-8" aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default loading;
