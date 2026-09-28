"use client";

import Column from "./Column";
import { ActiveColumnFormProvider } from "../contexts/ActiveColumnFormProvider";
import AddTaskStatus from "../../../../status/components/AddStatus";
import DragProvider from "../contexts/DragProvider";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import BoardSkeleton from "./BoardSkeleton";

function Columns() {
  const { statuses, isPending } = useStatuses();

  return (
    <section className="h-full overflow-x-auto p-3 sm:p-4">
      <main className="flex h-full min-w-fit flex-col gap-4 after:min-w-[0.1px] after:content-[''] lg:flex-row">
        <ActiveColumnFormProvider>
          <DragProvider>
            {isPending ? (
              <BoardSkeleton columnCount={4} />
            ) : (
              statuses?.map((status) => (
                <Column statusItem={status} key={status.id} />
              ))
            )}
          </DragProvider>
        </ActiveColumnFormProvider>
        <AddTaskStatus />
      </main>
    </section>
  );
}

export default Columns;
