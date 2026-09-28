"use client";

import Row from "./Row";
import NoWorkspace from "@/features/workspace/components/EmptySpaces";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import TaskProvider from "../../context/TaskProvider";
import useTasks from "../../hooks/useTasks";

function Body() {
  const { tasks, isPending } = useTasks();

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
            <Row task={task} sortNum={i + 1} />
          </TaskProvider>
        ))
      )}
    </>
  );
}

export default Body;
