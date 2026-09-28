"use client";

import { Task } from "@/features/task/types";
import { format } from "date-fns";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";
import StatusBadge from "@/features/status/components/StatusBadge";
import TaskRenameForm from "@/shared/components/RenameForm";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import DateUpdater from "@/features/task/components/DateUpdater";
import PriorityUpdater from "@/features/task/components/PriorityUpdater";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import StatusesUpdater from "@/features/status/components/StatusesUpdater";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { useState } from "react";
import { ICONS_REGISTRY } from "@/shared/ui/IconPicker/IconRegistry";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { TASK_PRIORITIES_LIST } from "../../constants/tasks.const";
import Field from "./Field";
import MetaItem from "./MetaItem";

function TaskDetailPanelInner({ task }: { task: Task }) {
  const { updateTask } = useUpdateTask();
  const [isRenaming, setIsRenaming] = useState(false);

  const StatusIcon = ICONS_REGISTRY[task.status.icon as IconsRegistry];
  const iconColor = COLORS_TOKENS[task.status.iconColor as ColorsToken]?.icon;

  return (
    <div className="flex w-[420px] flex-col overflow-hidden">
      <header className="flex items-center gap-2.5 bg-neutral-100 px-6 py-5 dark:bg-neutral-900/50">
        <StatusIcon className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <h2 className="truncate text-base font-semibold text-neutral-800 dark:text-neutral-100">
          {task.name}
        </h2>
      </header>

      <main className="flex flex-col px-6 py-3">
        <p className="mb-2 text-xs text-neutral-400 dark:text-neutral-500">
          Click any field to edit
        </p>

        <Field label="Name">
          {isRenaming ? (
            <TaskRenameForm
              initialName={task.name}
              onSave={(name) => {
                updateTask({ taskId: task.id, updateTaskInput: { name } });
                setIsRenaming(false);
              }}
              onClose={(e) => {
                e?.stopPropagation();
                setIsRenaming(false);
              }}
            />
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="w-full cursor-pointer truncate rounded px-2 py-1 text-left text-sm text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {task.name}
            </button>
          )}
        </Field>

        <Field label="Status">
          <Menu>
            <MenuTrigger>
              <button className="cursor-pointer rounded px-2 py-1 transition-opacity hover:opacity-75">
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
        </Field>

        <Field label="Priority">
          <Menu>
            <MenuTrigger>
              <button className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-neutral-700 capitalize hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700">
                {(() => {
                  const match = TASK_PRIORITIES_LIST.find(
                    (p) => p.label.toLowerCase() === task.priority,
                  );
                  return match ? (
                    <>
                      <ICONS_MAP.flag
                        className={`h-3.5 w-3.5 ${match.iconColor}`}
                      />
                      {match.label}
                    </>
                  ) : (
                    <>
                      <ICONS_MAP.flag className="h-3.5 w-3.5 text-neutral-400" />
                      No priority
                    </>
                  );
                })()}
              </button>
            </MenuTrigger>
            <MenuContent>
              <PriorityUpdater />
            </MenuContent>
          </Menu>
        </Field>

        <Field label="Dates" noBorder>
          <Menu>
            <MenuTrigger>
              <button className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700">
                <ICONS_MAP.date className="h-3.5 w-3.5 text-neutral-400" />
                {task.startDate
                  ? task.endDate
                    ? `${format(new Date(task.startDate), "MMM d")} → ${format(new Date(task.endDate), "MMM d, yyyy")}`
                    : format(new Date(task.startDate), "MMM d, yyyy")
                  : "No date"}
              </button>
            </MenuTrigger>
            <MenuContent>
              <DateUpdater />
            </MenuContent>
          </Menu>
        </Field>
      </main>

      <footer className="flex justify-between border-t border-neutral-200 px-6 py-3 dark:border-neutral-700">
        <MetaItem
          label="Created"
          value={format(new Date(task.createdAt), "MMM d, yyyy")}
        />
        <MetaItem
          label="Updated"
          value={format(new Date(task.updatedAt), "MMM d, yyyy")}
        />
      </footer>
    </div>
  );
}

export default TaskDetailPanelInner;
