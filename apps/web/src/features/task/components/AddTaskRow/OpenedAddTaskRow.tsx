import { ICONS_MAP } from "@/shared/icons/icons-map";
import AddTaskFeatureBtns from "./AddTaskFeatureBtns";
import { Button } from "@/shared/ui/Button";
import { useAddTaskForm } from "@/features/task/hooks/useAddTaskForm";
import { Task } from "@/features/task/types";
import { ICON_SIZE } from "./consts";
import { StyleFor } from "./type";
import { ICONS_REGISTRY } from "@/shared/ui/IconPicker/IconRegistry";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";
import { sizeClasses } from "@/shared/constants/styles";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { useWatch } from "react-hook-form";

function OpenedAddTaskRow({
  statusId,
  styleFor,
  onClose,
}: {
  statusId: Task["statusId"];
  styleFor: StyleFor;
  onClose: () => void;
}) {
  const { statuses } = useStatuses();
  const curStatus = statuses?.find((status) => status.id === statusId);
  const { formRef, register, isValid, handleSubmit, setValue, control } =
    useAddTaskForm({ onClose, statusId });

  const priority = useWatch({ control, name: "priority" }) ?? "none";
  const startDate = useWatch({ control, name: "startDate" }) ?? null;
  const endDate = useWatch({ control, name: "endDate" }) ?? null;

  if (!curStatus) return null;

  const Icon = ICONS_REGISTRY[curStatus.icon as IconsRegistry];

  const dateRange = {
    startDate,
    endDate,
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`${styleFor === "table" ? "col-span-19" : "col-span-6"} grid py-1`}
    >
      <div
        className={`${styleFor === "table" ? "col-span-12 col-start-2" : "col-span-1 px-2"} flex items-center gap-1`}
      >
        <Icon
          className={`${COLORS_TOKENS[curStatus.iconColor as ColorsToken].icon} ${sizeClasses[ICON_SIZE + 1]}`}
        />
        {/* <ButtonIcon
          icon={ICONS_REGISTRY[curStatus.icon as IconsRegistry]}
          ariaLabel="select task status button"
          padding="xSmall"
          iconColor={COLORS_TOKENS[curStatus.iconColor as ColorsToken]}
          size={ICON_SIZE + 1}
        /> */}
        <input
          autoFocus
          placeholder="Task Name or type"
          {...register("name")}
          className="h-full w-full outline-0"
        />
      </div>
      <div
        className={`${styleFor === "table" ? "col-span-7 col-start-14 justify-end" : "col-start-2 justify-center"} flex items-center gap-4 pr-4`}
      >
        <AddTaskFeatureBtns
          dateRange={dateRange}
          onDateChange={({ startDate, endDate }) => {
            setValue("startDate", startDate);
            setValue("endDate", endDate);
          }}
          priority={priority}
          onPriorityChange={(priority) => setValue("priority", priority)}
        />
        <div className="flex items-center gap-2">
          <Button
            type="secondary"
            size="small"
            ariaLabel="cancel add task"
            buttonFor="button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            ariaLabel="Save button"
            extraClasses="flex items-center gap-1"
            buttonFor="submit"
            size="small"
            disabled={!isValid}
          >
            <span>Save</span>
            <ICONS_MAP.leftArrow />
          </Button>
        </div>
      </div>
    </form>
  );
}

export default OpenedAddTaskRow;
