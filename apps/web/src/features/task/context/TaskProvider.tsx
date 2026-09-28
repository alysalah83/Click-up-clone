"use client";

import {
  createContext,
  memo,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Task } from "../types";

interface TaskProviderProps {
  children: React.ReactNode;
  task: Task;
}

interface TaskContextValues {
  task: Task;
  isRenameOpen: boolean;
  taskContainerRef: React.RefObject<HTMLDivElement | null>;
  toggleIsRenameOpen: () => void;
  isTempTask: boolean;
}

const TaskContext = createContext<TaskContextValues | null>(null);

function TaskProvider({ children, task }: TaskProviderProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const taskContainerRef = useRef<HTMLDivElement | null>(null);
  const toggleIsRenameOpen = useCallback(
    () => setIsRenameOpen((cur) => !cur),
    [],
  );
  const isTempTask = task.id.includes("temp");

  return (
    <TaskContext
      value={{
        task,
        isRenameOpen,
        taskContainerRef,
        toggleIsRenameOpen,
        isTempTask,
      }}
    >
      {children}
    </TaskContext>
  );
}

export function useTask() {
  const values = use(TaskContext);
  if (!values)
    throw new Error("task context is being used outside of his scope");
  return values;
}

export default TaskProvider;
