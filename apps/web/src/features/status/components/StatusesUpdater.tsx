import { useMenu } from "@/shared/ui/Menu/MenuCompound";
import { useUpdateTasks } from "../../task/hooks/useUpdateTasks";
import { Task } from "../../task/types";
import StatusesMenu from "./StatusesMenu";

function StatusesUpdater({ tasksId }: { tasksId: Set<Task["id"]> }) {
  const { updateTasks } = useUpdateTasks();
  const { toggleMenu } = useMenu();
  const handleUpdateTasks = (statusId: Task["statusId"]) => {
    updateTasks({ tasksId, updateTasksInput: { statusId } });
    toggleMenu();
  };

  return <StatusesMenu onStatusClick={handleUpdateTasks} />;
}

export default StatusesUpdater;
