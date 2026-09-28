import { List } from "../../list/types";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import Link from "next/link";

import { workspaceServices } from "@/features/workspace/services/workspace.service";
import { listServices } from "@/features/list/services/list.service";
import { tasksService } from "@/features/task/services/task.service";
import EmptySpaces from "@/features/workspace/components/EmptySpaces";

async function ListsSummery() {
  const [workspacesCount, lists] = await Promise.all([
    workspaceServices.getWorkspacesCount(),
    listServices.getLists(),
  ]);

  if (workspacesCount === 0) return <EmptySpaces />;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-300 bg-neutral-200 px-3 py-4 text-neutral-600 sm:px-6 md:px-8 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
      <h2 className="mb-4 flex items-end gap-4">
        <span className="text-lg font-semibold tracking-wide text-neutral-900 sm:text-2xl dark:text-neutral-100">
          All Lists
        </span>
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-500">
          Select a list
        </span>
        <span className="ml-auto text-sm font-medium text-neutral-700 dark:text-neutral-500">
          (Total/Complete) Tasks
        </span>
      </h2>
      <div className="flex flex-col gap-4">
        {lists.map((list) => (
          <ListItem list={list} key={list.id} />
        ))}
      </div>
    </div>
  );
}

async function ListItem({ list }: { list: List }) {
  const { name, id } = list;
  const { totalTasksCount, completedTasksCount } =
    await tasksService.getTasksCompleteAndTotalCounts(id);
  return (
    <div className="flex items-center justify-between gap-3 sm:gap-4">
      <Link href={`/home/lists/${id}/board`}>
        <div className="group flex cursor-pointer items-center gap-3">
          <ICONS_MAP.list className="size-3 fill-neutral-500 transition duration-200 group-hover:fill-neutral-600 sm:size-4 dark:fill-neutral-400 dark:group-hover:fill-neutral-500" />
          <span className="text-sm font-medium underline underline-offset-2 transition duration-200 group-hover:text-neutral-700 group-hover:no-underline group-active:text-neutral-700 group-active:no-underline sm:text-base dark:group-hover:text-neutral-500 dark:group-active:text-neutral-500">
            {name}
          </span>
        </div>
      </Link>
      {totalTasksCount ? (
        <div className={`flex items-center gap-4`}>
          <div className="relative h-2 w-24 rounded-lg bg-neutral-300 sm:w-52 dark:bg-neutral-800">
            <div
              style={{
                width: `${(completedTasksCount / totalTasksCount) * 100}%`,
              }}
              className="absolute inset-0 rounded-lg bg-neutral-600 dark:bg-neutral-500"
            />
          </div>
          <p className="w-12 text-center text-sm font-semibold text-neutral-500 tabular-nums dark:text-neutral-300">
            {completedTasksCount}/{totalTasksCount}
          </p>
        </div>
      ) : (
        <p className="text-sm font-medium sm:text-base sm:font-semibold">
          No Tasks to display
        </p>
      )}
    </div>
  );
}

export default ListsSummery;
