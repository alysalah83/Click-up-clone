import { Task } from "@/features/task/types";
import { ICONS_REGISTRY } from "@/shared/ui/IconPicker/IconRegistry";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";
import { hoverElementClasses } from "@/shared/constants/styles";
import { useStatuses } from "../hooks/useStatuses";
import {
  STATUS_ACTIVE_ORDER,
  STATUS_HIGHEST_ORDER,
  STATUS_LOWEST_ORDER,
} from "../consts";

function StatusesMenu({
  onStatusClick,
}: {
  onStatusClick: (statusId: Task["statusId"]) => void;
}) {
  const { statuses } = useStatuses();

  const toDoStatus = statuses?.find(
    (status) => status.order === STATUS_LOWEST_ORDER,
  );
  const inProgressStatus = statuses?.find(
    (status) => status.order === STATUS_ACTIVE_ORDER,
  );
  const completeStatus = statuses?.find(
    (status) => status.order === STATUS_HIGHEST_ORDER,
  );

  if (!toDoStatus || !inProgressStatus || !completeStatus) return;

  const ToDoIcon = ICONS_REGISTRY[toDoStatus.icon as IconsRegistry];
  const CompleteIcon = ICONS_REGISTRY[completeStatus.icon as IconsRegistry];

  const restStatus = statuses?.filter(
    (status) =>
      status.order !== toDoStatus.order &&
      status.order !== completeStatus.order,
  );

  return (
    <ul className="min-w-56">
      <li className="flex w-full flex-col gap-2 border-b border-neutral-700 px-3 py-3">
        <h4 className="ml-2 text-sm font-medium text-neutral-500">
          Not started
        </h4>
        <div
          className={`flex w-full items-center gap-1.5 rounded-lg p-2 transition duration-300 ${hoverElementClasses}`}
          onClick={() => onStatusClick(toDoStatus.id)}
        >
          <ToDoIcon
            className={`${COLORS_TOKENS[toDoStatus.iconColor as ColorsToken].icon} size-4`}
          />
          <span className="font-medium uppercase">{toDoStatus.name}</span>
        </div>
      </li>
      <li className="flex w-full flex-col gap-2 border-b border-neutral-700 px-3 py-3">
        <h4 className="ml-2 text-sm font-medium text-neutral-500">Active</h4>
        {restStatus?.map((status) => {
          const Icon = ICONS_REGISTRY[status.icon as IconsRegistry];
          const iconColorClass =
            COLORS_TOKENS[status.iconColor as ColorsToken].icon;
          return (
            <div
              className={`flex w-full items-center gap-1.5 rounded-lg p-2 transition duration-300 ${hoverElementClasses}`}
              onClick={() => onStatusClick(status.id)}
              key={status.id}
            >
              <Icon className={`${iconColorClass} size-4`} />
              <span className="font-medium uppercase">{status.name}</span>
            </div>
          );
        })}
      </li>
      <li className="w-full px-3 py-3">
        <div
          className={`flex w-full items-center gap-1.5 rounded-lg p-2 transition duration-300 ${hoverElementClasses}`}
          onClick={() => onStatusClick(completeStatus.id)}
        >
          <CompleteIcon
            className={`${COLORS_TOKENS[completeStatus.iconColor as ColorsToken].icon} size-4`}
          />
          <span className="font-medium uppercase">{completeStatus.name}</span>
        </div>
      </li>
    </ul>
  );
}

export default StatusesMenu;
