"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarStack } from "@/features/members/components/UserAvatar";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import type { Task } from "@/features/task/types";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import type { ColorsToken } from "@/shared/ui/ColorPicker/types";
import Checkbox from "@/shared/ui/CheckBox";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";
import { createSubtaskAction } from "../actions/taskDetail.actions";
import { taskDetailKey, useTaskDetailMutation } from "../hooks/useTaskDetail";
import type { TaskDetail } from "../types";
import ProgressBar from "./ProgressBar";
import SectionHeader from "./SectionHeader";

function SubtasksSection({
  detail,
  onOpenTask,
}: {
  detail: TaskDetail;
  onOpenTask: (taskId: string) => void;
}) {
  const { id: taskId, listId, subtasks } = detail;
  const { statuses } = useStatuses();
  const { updateTask } = useUpdateTask();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const create = useTaskDetailMutation(taskId, listId, (subtaskName: string) =>
    createSubtaskAction(taskId, subtaskName, listId),
  );

  const doneStatus = statuses?.find((s) => s.type === "done");
  const openStatus = statuses?.find((s) => s.type === "open");
  const doneCount = subtasks.filter((s) => s.status.type === "done").length;

  const toggleDone = (subtask: Task) => {
    const next = subtask.status.type === "done" ? openStatus : doneStatus;
    if (!next) return;
    queryClient.setQueryData<TaskDetail>(
      taskDetailKey(taskId),
      (d) =>
        d && {
          ...d,
          subtasks: d.subtasks.map((s) =>
            s.id === subtask.id ? { ...s, statusId: next.id, status: next } : s,
          ),
        },
    );
    updateTask({ taskId: subtask.id, updateTaskInput: { statusId: next.id } });
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(trimmed);
    setName("");
  };

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader
        title="Subtasks"
        count={
          subtasks.length > 0 ? `${doneCount}/${subtasks.length}` : undefined
        }
      >
        {subtasks.length > 0 && (
          <ProgressBar done={doneCount} total={subtasks.length} />
        )}
      </SectionHeader>

      {subtasks.length > 0 && (
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
          {subtasks.map((subtask) => {
            const isDone = subtask.status.type === "done";
            const dot =
              COLORS_TOKENS[subtask.status.bgColor as ColorsToken]?.hex ??
              "#a3a3a3";
            return (
              <li
                key={subtask.id}
                className="group flex items-center gap-2.5 px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => toggleDone(subtask)}
                />
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: dot }}
                  title={subtask.status.name}
                />
                <button
                  type="button"
                  onClick={() => onOpenTask(subtask.id)}
                  className={cn(
                    "min-w-0 flex-1 cursor-pointer truncate text-left text-neutral-800 hover:text-violet-600 dark:text-neutral-200 dark:hover:text-violet-300",
                    isDone &&
                      "text-neutral-400 line-through dark:text-neutral-500",
                  )}
                >
                  {subtask.name}
                </button>
                {subtask.assignees && subtask.assignees.length > 0 && (
                  <AvatarStack users={subtask.assignees} size="xs" max={2} />
                )}
                <ICONS_MAP.rightArrow2 className="size-4 text-neutral-400 opacity-0 transition group-hover:opacity-100" />
              </li>
            );
          })}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
      >
        <ICONS_MAP.plus className="size-3 text-neutral-400" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={create.isPending ? "Adding…" : "Add subtask"}
          aria-label="new subtask name"
          maxLength={128}
          className="w-full bg-transparent outline-none placeholder:text-neutral-500"
        />
      </form>
    </section>
  );
}

export default SubtasksSection;
