"use client";

import ListLoader from "./ListSkeleton";
import ListSlide from "./ListSlide";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { ViewToolbar } from "@/features/viewConfig/components/ViewToolbar";
import { useViewTasks } from "@/features/viewConfig/hooks/useViewTasks";
import { groupTasks } from "@/features/viewConfig/lib/applyViewConfig";

function ListSlides() {
  const { tasks, isPending: tasksIsPending, groupBy } = useViewTasks();
  const { statuses, isPending: statusesIsPending } = useStatuses();

  const toolbar = <ViewToolbar groupable />;
  if (tasksIsPending || statusesIsPending)
    return (
      <>
        {toolbar}
        <ListLoader />
      </>
    );

  return (
    <>
      {toolbar}
      <section className="flex h-fit flex-col gap-10 pt-4">
        {groupBy === "status"
          ? statuses?.toReversed().map((status) => {
              if (status.type === "done") return null;
              return (
                <ListSlide
                  status={status}
                  tasks={tasks?.filter((task) => task.statusId === status.id)}
                  key={status.id}
                />
              );
            })
          : groupTasks(tasks ?? [], groupBy).map((group) => (
              <ListSlide key={group.key} groupLabel={group.label} tasks={group.tasks} />
            ))}
      </section>
    </>
  );
}

export default ListSlides;
