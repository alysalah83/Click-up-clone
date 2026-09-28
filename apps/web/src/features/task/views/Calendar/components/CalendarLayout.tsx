"use client";

import useTasks from "../../../hooks/useTasks";
import CalendarGrid from "./CalendarGrid";
import CalendarHeader from "./CalendarHeader";
import { useState } from "react";
import { addDays } from "date-fns";
import DragProvider from "./DragProvider";

export type CalendarView = "month" | "week";

function CalendarLayout() {
  const { tasks, isPending } = useTasks();
  const tasksHasDates = tasks?.filter((task) => task.startDate);

  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const handlePrev = () => {
    if (view === "month")
      setCurrentDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1),
      );
    else setCurrentDate((prev) => addDays(prev, -7));
  };

  const handleNext = () => {
    if (view === "month")
      setCurrentDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1),
      );
    else setCurrentDate((prev) => addDays(prev, 7));
  };

  return (
    <DragProvider>
      <section className="flex h-full min-h-0 flex-col overflow-hidden">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onPrev={handlePrev}
          onNext={handleNext}
        />
        {!isPending && (
          <CalendarGrid
            currentDate={currentDate}
            tasks={tasksHasDates ?? []}
            view={view}
          />
        )}
      </section>
    </DragProvider>
  );
}

export default CalendarLayout;
