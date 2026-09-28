import TaskProvider from "../../context/TaskProvider";
import { Task } from "../../types";
import TaskDetailPanelInner from "./TaskDetailPanelIneer";

function TaskDetailPanel({ task }: { task: Task }) {
  return (
    <TaskProvider task={task}>
      <TaskDetailPanelInner task={task} />
    </TaskProvider>
  );
}

export default TaskDetailPanel;
