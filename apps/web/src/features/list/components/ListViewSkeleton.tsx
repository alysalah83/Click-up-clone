"use client";

import { usePathname } from "next/navigation";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import BoardSkeleton from "@/features/task/views/Board/components/BoardSkeleton";
import TableSkeleton from "@/features/task/views/Table/TableSkeleton";
import ListSkeleton from "@/features/task/views/List/ListSkeleton";
import ListsOverviewSkeleton from "./ListsOverviewSkeleton";

/** The view a `/home/lists/<id>/<view>` path shows; `board` for `/home/lists/<id>`. */
export function viewFromPathname(pathname: string) {
  const [, home, lists, listId, view] = pathname.split("/");
  if (home !== "home" || lists !== "lists") return null;
  if (!listId) return "overview";
  return view || "board";
}

function ToolbarSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 sm:px-4">
      <SkeletonLoader height="h-7" width="w-20" rounded="rounded-md" />
      <SkeletonLoader height="h-7" width="w-24" rounded="rounded-md" />
      <SkeletonLoader height="h-7" width="w-20" rounded="rounded-md" />
    </div>
  );
}

/**
 * Loading state for every list route, picked from the URL so the same skeleton
 * shows whichever boundary (route loading.tsx or the list layout's Suspense)
 * catches the navigation. Each one mirrors its view's padding and toolbar, so
 * nothing jumps when the real view replaces it.
 */
function ListViewSkeleton() {
  const view = viewFromPathname(usePathname());

  switch (view) {
    case "overview":
      return <ListsOverviewSkeleton />;
    case "board":
      return (
        <div className="flex h-full flex-col">
          <ToolbarSkeleton />
          <div className="p-3 sm:p-4">
            <BoardSkeleton columnCount={4} />
          </div>
        </div>
      );
    case "table":
      return (
        <>
          <ToolbarSkeleton />
          <TableSkeleton />
        </>
      );
    case "list":
      return (
        <div className="p-3 sm:p-4 lg:p-8">
          <ToolbarSkeleton />
          <ListSkeleton />
        </div>
      );
    case "calendar":
      return <CalendarSkeleton />;
    case "timeline":
    case "workload":
      return <TimelineSkeleton />;
    default:
      // Form, Sprint report and anything new: two content blocks.
      return (
        <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-8">
          <SkeletonLoader height="h-96" width="w-full" rounded="rounded-xl" />
          <SkeletonLoader height="h-96" width="w-full" rounded="rounded-xl" />
        </div>
      );
  }
}

export function CalendarSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <SkeletonLoader height="h-8" width="w-40" rounded="rounded-md" />
        <SkeletonLoader height="h-8" width="w-48" rounded="rounded-md" />
      </div>
      <CalendarGridSkeleton />
    </div>
  );
}

/** The month grid alone, for when the Calendar header is already on screen. */
export function CalendarGridSkeleton() {
  return (
    <div className="grid flex-1 grid-cols-7 gap-1">
      <SkeletonLoader height="h-24" width="w-full" rounded="rounded-md" count={35} />
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4">
      <SkeletonLoader height="h-8" width="w-full" rounded="rounded-md" />
      {["w-1/3", "w-1/2", "w-1/4", "w-2/5", "w-1/3", "w-3/5", "w-1/4", "w-1/2"].map(
        (width, i) => (
          <div className="flex items-center gap-4" key={i}>
            <div className="w-48 shrink-0">
              <SkeletonLoader height="h-6" width="w-full" rounded="rounded-md" />
            </div>
            <div style={{ marginLeft: `${(i * 7) % 30}%` }} className="flex-1">
              <SkeletonLoader height="h-6" width={width as `w-${string}`} rounded="rounded-md" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export default ListViewSkeleton;
