"use client";

import useTasks from "../../../hooks/useTasks";
import CalendarGrid from "./CalendarGrid";
import CalendarHeader from "./CalendarHeader";
import { useState } from "react";
import { addDays } from "date-fns";
import DragProvider from "./DragProvider";
import CalendarMobileView from "./CalendarMobileView";
import { CalendarGridSkeleton } from "@/features/list/components/ListViewSkeleton";

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

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
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
          onToday={handleToday}
        />
        {isPending ? (
          <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
            <CalendarGridSkeleton />
          </div>
        ) : (
          <>
            {/* Desktop grid (drag & drop); phones get the compact view below. */}
            <div className="hidden min-h-0 flex-1 flex-col md:flex">
              <CalendarGrid
                currentDate={currentDate}
                tasks={tasksHasDates ?? []}
                view={view}
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col md:hidden">
              <CalendarMobileView
                currentDate={currentDate}
                tasks={tasksHasDates ?? []}
                view={view}
              />
            </div>
          </>
        )}
      </section>
    </DragProvider>
  );
}

export default CalendarLayout;
