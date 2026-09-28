import { STATUS_ACTIVE_ORDER } from "@/features/status/consts";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { Status } from "@/features/status/types";
import PriorityMenu from "@/features/task/components/PriorityMenu";
import { TASK_PRIORITIES_LIST } from "@/features/task/constants/tasks.const";
import { useAddTaskForm } from "@/features/task/hooks/useAddTaskForm";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Button, ButtonIcon } from "@/shared/ui/Button";
import ErrorMessage from "@/shared/ui/ErrorMessage/ErrorMessage";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { Controller, useWatch } from "react-hook-form";

function CreateTaskRow({
  onClose,
  cellDate,
}: {
  onClose: () => void;
  cellDate: Date;
}) {
  const { statuses } = useStatuses();
  const inProgress = statuses?.find(
    (status) => status.order === STATUS_ACTIVE_ORDER,
  ) as Status;
  const { setValue, control, handleSubmit, isValid, errors, formRef } =
    useAddTaskForm({ statusId: inProgress?.id, onClose });
  const startDate = new Date(cellDate);
  setValue("startDate", startDate);
  const priority = useWatch({ control, name: "priority" }) ?? "none";
  const priorityObj = TASK_PRIORITIES_LIST.find(
    (prio) => prio.label.toLowerCase() === priority,
  );

  console.log(errors);

  return (
    <form
      onSubmit={handleSubmit}
      ref={formRef}
      className="flex h-fit w-full flex-col gap-2 rounded-md border border-neutral-500 p-1"
    >
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <input
              {...field}
              type="text"
              placeholder="Task Name..."
              className="w-full px-1 py-1 text-sm text-neutral-900 outline-0 dark:text-neutral-100"
            />
          )}
        />
        <ButtonIcon
          type="primary"
          size={3}
          btnType="submit"
          icon="checkMark"
          disabled={!isValid}
          ariaLabel="create task button"
        />
      </div>
      {Object.keys(errors).length > 0 && (
        <ErrorMessage error={errors.name?.message} />
      )}
      <Menu>
        <MenuTrigger containerClasses="w-full">
          <Button
            ariaLabel="add priority button"
            type="secondary"
            stretch={true}
            size="small"
          >
            <div className="flex items-center gap-2">
              <ICONS_MAP.flag className={priorityObj?.iconColor} />
              <span>
                {priority !== "none"
                  ? priority.charAt(0).toUpperCase() + priority.slice(1)
                  : "Priority"}
              </span>
            </div>
          </Button>
        </MenuTrigger>
        <MenuContent>
          <PriorityMenu action={(priority) => setValue("priority", priority)} />
        </MenuContent>
      </Menu>

      {/* <Menu>
            <MenuTrigger>
              <ButtonIcon
                ariaLabel="add endDate button"
                icon="date"
                type="bordered"
                size={3}
              />
            </MenuTrigger>
            <MenuContent>
              <DateRangePicker
                onDateChange={(dateRange) =>
                  setValue("endDate", dateRange?.endDate)
                }
                dateRanges={{ startDate, endDate: null }}
              />
            </MenuContent>
          </Menu> */}
    </form>
  );
}

export default CreateTaskRow;
