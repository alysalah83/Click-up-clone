"use client";

import Row from "./Row";
import NoWorkspace from "@/features/workspace/components/EmptySpaces";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import TaskProvider from "../../context/TaskProvider";
import { useViewTasks } from "@/features/viewConfig/hooks/useViewTasks";
import { useCustomFields } from "@/features/customFields/hooks";
import { useTasksQueryKey } from "../../hooks/useTasksQueryKey";

function Body() {
  const { tasks, isPending } = useViewTasks();
  const { listId } = useTasksQueryKey();
  const { fields } = useCustomFields(listId);

  if (!tasks && !isPending) return <NoWorkspace />;

  return (
    <>
      {isPending ? (
        <div className="flex flex-col gap-2 px-6 pt-2">
          <SkeletonLoader
            height="h-6"
            width="w-full"
            rounded="rounded-sm"
            count={20}
          />
        </div>
      ) : (
        tasks?.map((task, i) => (
          <TaskProvider task={task} key={task.id}>
            <Row task={task} sortNum={i + 1} fields={fields} />
          </TaskProvider>
        ))
      )}
    </>
  );
}

export default Body;
