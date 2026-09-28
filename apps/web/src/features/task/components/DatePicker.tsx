import { DateRange } from "react-date-range";
import { TaskDateRange } from "../types";
import { Button } from "@/shared/ui/Button";

type DateState = {
  startDate: Date;
  endDate: Date;
  key: string;
}[];

function DatePicker({
  action,
  date,
  setDate,
}: {
  action: (date?: TaskDateRange) => void;
  date: DateState;
  setDate: React.Dispatch<React.SetStateAction<DateState>>;
}) {
  return (
    <div className="flex flex-col">
      <DateRange
        editableDateInputs={true}
        onChange={(item) => {
          const { startDate, endDate, key } = item.selection!;
          setDate([
            {
              startDate: startDate || new Date(),
              endDate: endDate || new Date(),
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
          onClick={() => action()}
          type="secondary"
        >
          Clear
        </Button>
        <Button
          size="large"
          ariaLabel="confirm task date"
          stretch={true}
          onClick={() =>
            action({
              startDate: date[0]?.startDate!,
              endDate: date[0]?.endDate!,
            })
          }
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

export default DatePicker;
