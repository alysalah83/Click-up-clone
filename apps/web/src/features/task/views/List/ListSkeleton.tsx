import SkeletonLoader from "@/shared/ui/SkeletonLoader";

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-10 p-8">
      <div className="flex flex-col gap-3">
        <SkeletonLoader height="h-7" width="w-28" />
        <div className="flex flex-col gap-2">
          <SkeletonLoader height="h-10" width="w-full" count={5} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <SkeletonLoader height="h-7" width="w-28" />
        <div className="flex flex-col gap-2">
          <SkeletonLoader height="h-10" width="w-full" count={5} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <SkeletonLoader height="h-7" width="w-28" />
        <div className="flex flex-col gap-2">
          <SkeletonLoader height="h-10" width="w-full" count={5} />
        </div>
      </div>
    </div>
  );
}

export default ListSkeleton;
