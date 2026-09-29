"use client";

import ListLoader from "./ListSkeleton";
import ListSlide from "./ListSlide";
import useTasks from "../../hooks/useTasks";
import { useStatuses } from "@/features/status/hooks/useStatuses";

function ListSlides() {
  const { tasks, isPending: tasksIsPending } = useTasks();
  const { statuses, isPending: statusesIsPending } = useStatuses();

  if (tasksIsPending || statusesIsPending) return <ListLoader />;

  return (
    <section className="flex h-fit flex-col gap-10">
      {statuses?.toReversed().map((status) => {
        if (status.type === "done") return null;
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
