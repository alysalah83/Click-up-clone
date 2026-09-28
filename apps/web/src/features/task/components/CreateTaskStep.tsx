import ControlledInput from "@/shared/ui/Input/ControlledInput";
import { Task } from "../types";
import { ButtonIcon } from "@/shared/ui/Button";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { TASK_ICON_SIZE, TASK_PRIORITIES_LIST } from "../constants/tasks.const";
import { getFormattedRangeDate } from "@/shared/lib/utils/getFormattedRangeDate";
import DateRangePicker from "@/shared/ui/DateRangePicker";
import PriorityMenu from "./PriorityMenu";

function CreateTaskStep({
  data,
  onChange,
  onBlur,
}: {
  data: {
    name: Task["name"];
    priority: Task["priority"];
    startDate: Task["startDate"];
    endDate: Task["endDate"];
  };
  onChange: (fields: Record<string, unknown>) => void;
  onBlur: () => void;
}) {
  const { endDate, name, priority, startDate } = data;

  const curPriority = TASK_PRIORITIES_LIST.find(
    (prio) => prio.label.toLowerCase() === priority,
  );

  return (
    <div className="flex max-w-80 flex-col gap-5 px-6 pt-6 pb-3 text-neutral-700 lg:max-w-lg lg:min-w-lg dark:text-neutral-500">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Create a Task
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          A Task that get added to a status with priority and due date.
        </p>
      </header>
      <hr className="border-neutral-200 dark:border-neutral-700" />
      <main className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          Name & Date & Priority
        </h3>
        <div className="w-full">
          <ControlledInput
            inputStyle="primary"
            name="task name"
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            onBlur={onBlur}
            placeholder="Task Name"
          />
        </div>
        <div className="flex w-full items-center gap-4">
          <Menu>
            <MenuTrigger>
              <ButtonIcon
                icon="date"
                type="bordered"
                label={
                  startDate && endDate
                    ? getFormattedRangeDate({ startDate, endDate })
                    : "Add date"
                }
                ariaLabel={`add date button`}
                size={TASK_ICON_SIZE}
              />
            </MenuTrigger>
            <MenuContent>
              <DateRangePicker
                onDateChange={({ startDate, endDate }) => {
                  onChange({ startDate, endDate });
                }}
                dateRanges={{ startDate, endDate }}
              />
            </MenuContent>
          </Menu>
          <Menu>
            <MenuTrigger>
              <ButtonIcon
                icon="flag"
                type="bordered"
                label={priority === "none" ? "Add priority" : priority}
                iconColor={priority !== "none" ? curPriority?.iconColor : ""}
                ariaLabel="add priority button"
                size={TASK_ICON_SIZE}
              />
            </MenuTrigger>
            <MenuContent>
              <PriorityMenu action={(priority) => onChange({ priority })} />
            </MenuContent>
          </Menu>
        </div>
      </main>
    </div>
  );
}

export default CreateTaskStep;
