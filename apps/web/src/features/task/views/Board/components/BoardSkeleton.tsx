import SkeletonLoader from "@/shared/ui/SkeletonLoader";

function BoardSkeleton({ columnCount = 3 }: { columnCount: number }) {
  return (
    <div className="flex gap-6 p-4">
      {Array.from({ length: columnCount }).map((_, index) => (
        <div className="flex w-2xs flex-col gap-1" key={index}>
          <div className="flex h-6 items-center justify-between">
            <SkeletonLoader height="h-full" width="w-18" rounded="rounded-md" />
            <SkeletonLoader height="h-4" width="w-4" rounded="rounded-full" />
          </div>
          <SkeletonLoader height="h-22" width="w-full" count={6} />
        </div>
      ))}
    </div>
  );
}

export default BoardSkeleton;
