"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import { Repeat } from "lucide-react";
import StatusBadge from "@/features/status/components/StatusBadge";
import StatusesUpdater from "@/features/status/components/StatusesUpdater";
import { AssigneesButton } from "@/features/members/components/AssigneePicker";
import TagsField from "@/features/taskDetail/components/TagsField";
import type { TaskDetail } from "@/features/taskDetail/types";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import RepeatField from "./RepeatField";
import PointsPicker from "@/features/sprint/components/PointsPicker";
import DateUpdater from "../DateUpdater";
import PriorityUpdater from "../PriorityUpdater";
import { TASK_PRIORITIES_LIST } from "../../constants/tasks.const";

const valueButton =
  "flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700";

function Property({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-9 items-center gap-2">
      <span className="flex w-28 shrink-0 items-center gap-2 text-sm text-neutral-500">
        {icon}
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function datesLabel({
  startDate,
  endDate,
}: Pick<TaskDetail, "startDate" | "endDate">) {
  if (!startDate && !endDate) return "Empty";
  const start = startDate ? format(new Date(startDate), "MMM d") : null;
  const end = endDate ? format(new Date(endDate), "MMM d, yyyy") : null;
  if (start && end && format(new Date(startDate!), "MMM d, yyyy") !== end)
    return `${start} → ${end}`;
  return end ?? format(new Date(startDate!), "MMM d, yyyy");
}

/** Status, assignees, dates, priority and tags: the task page's property grid. Needs TaskProvider. */
function PropertiesGrid({ task }: { task: TaskDetail }) {
  const priority = TASK_PRIORITIES_LIST.find(
    (p) => p.label.toLowerCase() === task.priority,
  );
  const iconClass = "size-3.5";

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
      <Property
        label="Status"
        icon={<ICONS_MAP.inProgress className={iconClass} />}
      >
        <Menu>
          <MenuTrigger>
            <button
              type="button"
              aria-label="change status"
              className="cursor-pointer rounded px-2 py-1 hover:opacity-80"
            >
              <StatusBadge
                status={task.status.name}
                icon={task.status.icon}
                bgColor={task.status.bgColor}
                size="small"
              />
            </button>
          </MenuTrigger>
          <MenuContent>
            <StatusesUpdater tasksId={new Set([task.id])} />
          </MenuContent>
        </Menu>
      </Property>

      <Property
        label="Assignees"
        icon={<ICONS_MAP.user className={iconClass} />}
      >
        <AssigneesButton
          task={task}
          size="sm"
          max={6}
          emptyLabel="Empty"
          className="px-2 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-700"
        />
      </Property>

      <Property label="Dates" icon={<ICONS_MAP.date className={iconClass} />}>
        <Menu>
          <MenuTrigger>
            <button
              type="button"
              aria-label="change dates"
              className={valueButton}
            >
              {datesLabel(task)}
            </button>
          </MenuTrigger>
          <MenuContent>
            <DateUpdater />
          </MenuContent>
        </Menu>
      </Property>

      <Property
        label="Priority"
        icon={<ICONS_MAP.flag className={iconClass} />}
      >
        <Menu>
          <MenuTrigger>
            <button
              type="button"
              aria-label="change priority"
              className={`${valueButton} capitalize`}
            >
              <ICONS_MAP.flag
                className={`size-3.5 ${priority?.iconColor ?? "text-neutral-400"}`}
              />
              {priority?.label ?? "Empty"}
            </button>
          </MenuTrigger>
          <MenuContent>
            <PriorityUpdater />
          </MenuContent>
        </Menu>
      </Property>

      <Property
        label="Sprint points"
        icon={
          <svg aria-hidden viewBox="0 0 12 12" className={`${iconClass} fill-none stroke-current`}>
            <path d="M6 0.75 11 3.4v5.2L6 11.25 1 8.6V3.4z" strokeWidth="1.2" />
          </svg>
        }
      >
        <PointsPicker taskId={task.id} points={task.points} className={valueButton}>
          {task.points != null ? `${task.points} point${task.points === 1 ? "" : "s"}` : "Empty"}
        </PointsPicker>
      </Property>

      <Property label="Repeat" icon={<Repeat className={iconClass} />}>
        <RepeatField task={task} />
      </Property>

      <div className="sm:col-span-2">
        <Property
          label="Tags"
          icon={
            <span className={`${iconClass} text-center leading-none`}>#</span>
          }
        >
          <TagsField detail={task} />
        </Property>
      </div>
    </div>
  );
}

export default PropertiesGrid;
