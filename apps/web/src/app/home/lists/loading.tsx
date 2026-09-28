import SkeletonLoader from "@/shared/ui/SkeletonLoader";

function loading() {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-300 bg-neutral-200 px-8 py-4 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
        <h2 className="mb-4 flex items-end gap-4">
          <span className="text-2xl font-semibold tracking-wide text-neutral-900 dark:text-neutral-100">
            Lists
          </span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-500">
            Select a list
          </span>
        </h2>
        <div className="flex items-center justify-between">
          <SkeletonLoader
            width="w-14"
            height="h-6"
            rounded="rounded-sm"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
          <SkeletonLoader
            width="w-3xs"
            height="h-5"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
        </div>
        <div className="flex items-center justify-between">
          <SkeletonLoader
            width="w-14"
            height="h-6"
            rounded="rounded-sm"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
          <SkeletonLoader
            width="w-3xs"
            height="h-5"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
        </div>
        <div className="flex items-center justify-between">
          <SkeletonLoader
            width="w-14"
            height="h-6"
            rounded="rounded-sm"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
          <SkeletonLoader
            width="w-3xs"
            height="h-5"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
        </div>
        <div className="flex items-center justify-between">
          <SkeletonLoader
            width="w-14"
            height="h-6"
            rounded="rounded-sm"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
          <SkeletonLoader
            width="w-3xs"
            height="h-5"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
        </div>
        <div className="flex items-center justify-between">
          <SkeletonLoader
            width="w-14"
            height="h-6"
            rounded="rounded-sm"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
          <SkeletonLoader
            width="w-3xs"
            height="h-5"
            bgColor="bg-neutral-300 dark:bg-neutral-800"
          />
        </div>
      </div>
    </div>
  );
}

export default loading;
