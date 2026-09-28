import SkeletonLoader from "@/shared/ui/SkeletonLoader";

function TableSkeleton() {
  return (
    <div className="flex w-full flex-col gap-2 px-6 pt-2">
      <SkeletonLoader
        height="h-6"
        width="w-full"
        rounded="rounded-sm"
        count={20}
      />
    </div>
  );
}

export default TableSkeleton;
