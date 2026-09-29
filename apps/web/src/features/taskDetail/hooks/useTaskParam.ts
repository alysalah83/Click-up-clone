"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** The open task panel lives in the URL (`?task=<id>`), so a task page can be shared. */
export function useTaskParam() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setTask = useCallback(
    (taskId: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (taskId) params.set("task", taskId);
      else params.delete("task");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return {
    taskId: searchParams.get("task"),
    openTask: setTask,
    closeTask: useCallback(() => setTask(null), [setTask]),
  };
}

/**
 * Opens a task's panel without subscribing to the search params, so a board of cards does not
 * re-render when the URL changes. Reads the current query at click time.
 */
export function useOpenTask() {
  const router = useRouter();
  return useCallback(
    (taskId: string) => {
      const params = new URLSearchParams(window.location.search);
      params.set("task", taskId);
      router.push(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router],
  );
}
