"use client";

import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { MONTH_NAMES } from "../calendar.consts";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { CalendarView } from "./CalendarLayout";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const title =
    view === "month"
      ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : (() => {
          const start = startOfWeek(currentDate, { weekStartsOn: 0 });
          const end = endOfWeek(currentDate, { weekStartsOn: 0 });
          return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
        })();

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-neutral-300 px-3 py-2 md:flex-nowrap md:px-4 md:py-3 dark:border-neutral-700">
      <div className="order-1 flex items-center rounded-md border border-neutral-300 p-0.5 dark:border-neutral-700">
        {(["month", "week"] as CalendarView[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`rounded px-3 py-1 text-sm font-medium capitalize transition-colors ${
              view === v
                ? "bg-indigo-600 text-white"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Phones only: jump back to today. */}
      <button
        type="button"
        onClick={onToday}
        className="order-2 rounded-md border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 md:hidden dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-neutral-100"
      >
        Today
      </button>

      <div className="order-3 flex w-full items-center justify-between gap-2 md:order-2 md:w-auto md:justify-start">
        <ButtonIcon
          icon="leftArrow2"
          ariaLabel="Previous"
          onClick={onPrev}
          withBg
          padding="small"
          size={4}
        />
        <h2 className="min-w-0 truncate text-center md:min-w-[220px] text-base font-semibold text-neutral-800 dark:text-neutral-100">
          {title}
        </h2>
        <ButtonIcon
          icon="rightArrow2"
          ariaLabel="Next"
          onClick={onNext}
          withBg
          padding="small"
          size={4}
        />
      </div>

      {/* Spacer to balance flex layout */}
      <div className="hidden w-[116px] md:order-3 md:block" />
    </div>
  );
}

export default CalendarHeader;
