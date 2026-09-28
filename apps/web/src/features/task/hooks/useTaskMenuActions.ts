import { OptionActionItem } from "@/shared/types/types";
import { useTask } from "../context/TaskProvider";
import { useDeleteTask } from "./useDeleteTask";

export function useTaskMenuActions() {
  const {
    toggleIsRenameOpen,
    task: { id },
  } = useTask();
  const { deleteTask } = useDeleteTask();
  const deletedTaskWithId = deleteTask.bind(null, { taskId: id });

  return [
    { id: "rename", action: toggleIsRenameOpen },
    { id: "delete", action: deletedTaskWithId },
  ] as OptionActionItem[];
}
