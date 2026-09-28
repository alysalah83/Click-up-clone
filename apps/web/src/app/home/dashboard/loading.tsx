import SkeletonLoader from "@/shared/ui/SkeletonLoader";

function loading() {
  return (
    <div className="p-8">
      <main className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="col-span-1 grid h-[350px] grid-cols-2 gap-4 text-neutral-400">
          <SkeletonLoader height="h-full" width="w-full" rounded="rounded-xl" />
          <SkeletonLoader height="h-full" width="w-full" rounded="rounded-xl" />
          <div className="col-span-2">
            <SkeletonLoader
              height="h-full"
              width="w-full"
              rounded="rounded-xl"
            />
          </div>
        </section>
        <SkeletonLoader width="w-full" height="h-full" rounded="rounded-xl" />
        <section className="col-span-1 h-[350px]">
          <SkeletonLoader width="w-full" height="h-full" rounded="rounded-xl" />
        </section>
      </main>
    </div>
  );
}

export default loading;
