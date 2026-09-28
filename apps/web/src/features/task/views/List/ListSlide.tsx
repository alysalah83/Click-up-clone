import StatusBadge from "../../../status/components/StatusBadge";
import TaskProvider from "../../context/TaskProvider";
import { Task } from "../../types";
import AddTaskRow from "../../components/AddTaskRow";
import { listBgHoverGradient, listRowBorder } from "./list.styles";
import ListSlideRow from "./ListSlideRow";
import SortRowField from "../../components/Sort/SortRowField";

function ListSlide({
  status,
  tasks,
}: {
  status: Task["status"];
  tasks: Task[] | undefined;
}) {
  const { id, name, bgColor, icon } = status;
  const tasksCount = tasks?.length;

  return (
    <div className="flex min-w-full flex-col gap-3 overflow-x-auto">
      <div className="min-w-2xl">
        <header className="flex items-center gap-2">
          <StatusBadge status={name} bgColor={bgColor} icon={icon} />
          <span className="font-medium text-neutral-600 tabular-nums">
            {tasksCount}
          </span>
        </header>
        <main className="flex flex-col">
          <header
            className={`grid cursor-default grid-cols-21 ${listRowBorder} text-sm font-medium text-neutral-600`}
          >
            <div
              className={`col-span-10 flex items-center p-2 ${listBgHoverGradient}`}
            >
              <span>Name</span>
            </div>
            <div
              className={`col-span-3 flex items-center gap-2 p-2 ${listBgHoverGradient}`}
            >
              <span>Due date</span>
              <SortRowField sortField="dueDate" usedFor="list" />
            </div>
            <div
              className={`col-span-3 flex items-center gap-2 p-2 ${listBgHoverGradient}`}
            >
              <span>Priority</span>
              <SortRowField sortField="priority" usedFor="list" />
            </div>
            <div
              className={`col-span-3 flex items-center p-2 ${listBgHoverGradient}`}
            >
              <span>Status</span>
            </div>
          </header>
          <section>
            {tasks?.map((task) => (
              <TaskProvider task={task} key={task.id}>
                <ListSlideRow />
              </TaskProvider>
            ))}
            <AddTaskRow statusId={id} styleFor="list" />
          </section>
        </main>
      </div>
    </div>
  );
}

export default ListSlide;
