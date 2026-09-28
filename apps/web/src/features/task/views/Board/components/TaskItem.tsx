import TaskProvider from "@/features/task/context/TaskProvider";
import TaskCard from "./TaskCard";
import { Task } from "@/features/task/types";

const TaskItem = function TaskItem({ task }: { task: Task }) {
  return (
    <TaskProvider task={task} key={task.id}>
      <TaskCard task={task} />
    </TaskProvider>
  );
};
export default TaskItem;
