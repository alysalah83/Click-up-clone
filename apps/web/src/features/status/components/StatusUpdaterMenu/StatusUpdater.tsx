import { useUpdateTask } from "../../../task/hooks/useUpdateTask";
import { useMenu } from "@/shared/ui/Menu/MenuCompound";
import { useTask } from "../../../task/context/TaskProvider";
import { Task } from "../../../task/types";
import StatusesMenu from "../StatusesMenu";

function StatusUpdater() {
  const {
    task: { id },
  } = useTask();
  const { updateTask } = useUpdateTask();
  const { toggleMenu } = useMenu();
  const handleUpdateTask = (statusId: Task["statusId"]) => {
    updateTask({ taskId: id, updateTaskInput: { statusId } });
    toggleMenu();
  };

  return <StatusesMenu onStatusClick={handleUpdateTask} />;
}

export default StatusUpdater;
