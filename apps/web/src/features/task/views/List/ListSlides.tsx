"use client";

import ListLoader from "./ListSkeleton";
import ListSlide from "./ListSlide";
import useTasks from "../../hooks/useTasks";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { STATUS_HIGHEST_ORDER } from "@/features/status/consts";

function ListSlides() {
  const { tasks, isPending: tasksIsPending } = useTasks();
  const { statuses, isPending: statusesIsPending } = useStatuses();

  if (tasksIsPending || statusesIsPending) return <ListLoader />;

  return (
    <section className="flex h-fit flex-col gap-10">
      {statuses?.toReversed().map((status) => {
        if (status.order === STATUS_HIGHEST_ORDER) return null;
        return (
          <ListSlide
            status={status}
            tasks={tasks?.filter((task) => task.statusId === status.id)}
            key={status.id}
          />
        );
      })}
    </section>
  );
}

export default ListSlides;
