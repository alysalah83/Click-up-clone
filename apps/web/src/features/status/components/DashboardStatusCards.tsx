import { workspaceServices } from "@/features/workspace/services/workspace.service";
import { listServices } from "@/features/list/services/list.service";
import { tasksService } from "@/features/task/services/task.service";

async function DashboardStatusCards() {
  const [workspacesCount, listsCount, tasksCount] = await Promise.all([
    workspaceServices.getWorkspacesCount(),
    listServices.getListsCount(),
    tasksService.getTasksCount(),
  ]);

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-200 p-4 pt-2 dark:border-neutral-600 dark:bg-neutral-900">
        <h3 className="text-xl font-semibold tracking-wide">Tasks</h3>
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <span className="text-4xl font-bold text-neutral-500 tabular-nums dark:text-neutral-300">
            {tasksCount}
          </span>
          <span className="text-base font-medium text-neutral-700 dark:text-neutral-500">
            Count
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-200 p-4 pt-2 dark:border-neutral-600 dark:bg-neutral-900">
        <h3 className="text-xl font-semibold tracking-wide">Lists</h3>
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <span className="text-4xl font-bold text-neutral-500 tabular-nums dark:text-neutral-300">
            {listsCount}
          </span>
          <span className="text-base font-medium text-neutral-500">Count</span>
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-200 p-4 pt-2 sm:col-span-2 dark:border-neutral-600 dark:bg-neutral-900">
        <h3 className="text-xl font-semibold tracking-wide">Workspaces</h3>
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <span className="text-4xl font-bold text-neutral-500 tabular-nums dark:text-neutral-300">
            {workspacesCount}
          </span>
          <span className="text-base font-medium text-neutral-700 dark:text-neutral-500">
            Count
          </span>
        </div>
      </div>
    </>
  );
}

export default DashboardStatusCards;
