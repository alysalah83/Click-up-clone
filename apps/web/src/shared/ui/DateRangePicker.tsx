"use client";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useState } from "react";
import { useMenu } from "@/shared/ui/Menu/MenuCompound";
import { DateRange } from "react-date-range";
import { TaskDateRange } from "@/features/task/types";
import Button from "./Button/Button";

interface DateRangePickerProps {
  dateRanges: TaskDateRange;
  onDateChange: (dateRang: TaskDateRange) => void;
}

function DateRangePicker({ onDateChange, dateRanges }: DateRangePickerProps) {
  const [date, setDate] = useState([
    {
      startDate: dateRanges.startDate ?? undefined,
      endDate: dateRanges.endDate ?? new Date(),
      key: "selection",
    },
  ]);
  const { toggleMenu } = useMenu();

  const handleConfirm = function () {
    onDateChange({
      startDate: date[0]?.startDate ?? null,
      endDate: date[0]?.endDate ?? null,
    });
    toggleMenu();
  };

  const handleClear = () => {
    toggleMenu();
    onDateChange({ startDate: new Date(), endDate: null });
  };

  return (
    <div className="flex flex-col">
      <DateRange
        editableDateInputs={true}
        onChange={(item) => {
          const { startDate, endDate, key } = item.selection!;
          setDate([
            {
              startDate: startDate ?? new Date(),
              endDate: endDate ?? new Date(),
              key: key || "selection",
            },
          ]);
        }}
        moveRangeOnFirstSelection={false}
        ranges={date}
        rangeColors={["#525252"]}
      />
      <div className="flex gap-2 rounded-b-xl border-t border-neutral-200 bg-neutral-300 px-4 py-4 dark:border-neutral-400 dark:bg-neutral-800">
        <Button
          size="large"
          ariaLabel="clear task date"
          stretch={true}
          onClick={handleClear}
          type="secondary"
        >
          Clear
        </Button>
        <Button
          size="large"
          ariaLabel="confirm task date"
          stretch={true}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
export default DateRangePicker;
