import { useActiveColumnForm } from "../contexts/ActiveColumnFormProvider";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { hoverElementClasses } from "@/shared/constants/styles";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import DateRangePicker from "@/shared/ui/DateRangePicker";
import {
  TASK_FEATURES,
  TASK_PRIORITIES_LIST,
} from "@/features/task/constants/tasks.const";
import { Task } from "@/features/task/types";
import { useAddTaskForm } from "@/features/task/hooks/useAddTaskForm";
import { Button } from "@/shared/ui/Button";
import { ICON_SIZE } from "../board.const";
import { getFormattedRangeDate } from "@/shared/lib/utils/getFormattedRangeDate";
import PriorityMenu from "@/features/task/components/PriorityMenu";
import ErrorMessage from "@/shared/ui/ErrorMessage/ErrorMessage";
import { Controller, useWatch } from "react-hook-form";

interface AddTaskFormProps {
  columnStatusId: Task["statusId"];
}

function AddTaskForm({ columnStatusId }: AddTaskFormProps) {
  const { handleCloseForm } = useActiveColumnForm();
  const {
    register,
    handleSubmit,
    setValue,
    isValid,
    formRef,
    errors,
    control,
  } = useAddTaskForm({
    onClose: handleCloseForm,
    statusId: columnStatusId,
  });
  const priority = useWatch({ control, name: "priority" });
  const startDate = useWatch({ control, name: "startDate" });
  const endDate = useWatch({ control, name: "endDate" });

  const watchedDates = {
    startDate,
    endDate,
  };
  const dateRanges = {
    startDate: watchedDates.startDate ?? null,
    endDate: watchedDates.endDate ?? null,
  };

  const [dataObj, priorityObj] = TASK_FEATURES;
  const curPriority = TASK_PRIORITIES_LIST.find(
    (prio) => prio.label.toLowerCase() === priority,
  );

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border-2 border-neutral-500 bg-neutral-100 p-2 text-neutral-600/80 dark:border-neutral-400 dark:bg-neutral-900 dark:text-neutral-400/80"
      ref={formRef}
      onSubmit={handleSubmit}
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
        <Button
          ariaLabel="save new task button"
          size="small"
          buttonFor="submit"
          disabled={!isValid}
        >
          <span className="flex items-center gap-1">
            <span>Save</span>
            <ICONS_MAP.leftArrow className="size-3 fill-neutral-100 text-neutral-100 dark:fill-neutral-900 dark:text-neutral-900" />
          </span>
        </Button>
      </div>
      <ErrorMessage error={errors.name?.message} />
      <div className="flex w-full flex-col gap-2">
        <Menu>
          <MenuTrigger>
            <div
              className={`flex w-full items-center gap-1 rounded-lg p-1 ${hoverElementClasses}`}
            >
              <ButtonIcon
                icon={dataObj.icon}
                ariaLabel={`${dataObj.label} button`}
                size={ICON_SIZE}
              />
              <span className="text-sm">
                {dateRanges.startDate && dateRanges.endDate
                  ? getFormattedRangeDate(dateRanges)
                  : dataObj.label}
              </span>
            </div>
          </MenuTrigger>
          <MenuContent>
            <DateRangePicker
              onDateChange={({ startDate, endDate }) => {
                setValue("startDate", startDate, { shouldValidate: false });
                setValue("endDate", endDate, { shouldValidate: false });
              }}
              dateRanges={dateRanges}
            />
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger>
            <div
              className={`flex w-full items-center gap-1 rounded-lg p-1 ${hoverElementClasses}`}
            >
              <ButtonIcon
                icon={priorityObj.icon}
                iconColor={priority !== "none" ? curPriority?.iconColor : ""}
                ariaLabel={`${priorityObj.label} button`}
                size={ICON_SIZE}
              />
              <span className="text-sm capitalize">
                {priority === "none" ? priorityObj.label : priority}
              </span>
            </div>
          </MenuTrigger>
          <MenuContent>
            <PriorityMenu
              action={(priority) =>
                setValue("priority", priority, { shouldValidate: false })
              }
            />
          </MenuContent>
        </Menu>
      </div>
    </form>
  );
}

export default AddTaskForm;
