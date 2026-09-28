"use client";

import { createContext, use, useCallback, useMemo, useState } from "react";
import useTasks from "../hooks/useTasks";

interface CheckTaskValues {
  checkedTasksIdSet: Set<string>;
  isAllChecked: boolean | undefined;
  handleCheckTask: (taskId: string) => void;
  handleCheckAll: () => void;
  handleClearAllChecked: () => void;
}

const CheckTaskContext = createContext<CheckTaskValues | null>(null);

function CheckTaskProvider({ children }: { children: React.ReactNode }) {
  const { tasks } = useTasks();
  const [checkedTasksIdSet, setCheckedTasksIdSet] = useState<Set<string>>(
    new Set(),
  );
  const isAllChecked = useMemo(
    () => tasks?.every((task) => checkedTasksIdSet.has(task.id)),
    [checkedTasksIdSet, tasks],
  );

  const handleCheckTask = useCallback((taskId: string) => {
    setCheckedTasksIdSet((curCheckedSet) => {
      const newCheckedSet = new Set(curCheckedSet);
      const isTaskChecked = newCheckedSet.has(taskId);
      if (isTaskChecked) newCheckedSet.delete(taskId);
      else if (!isTaskChecked) newCheckedSet.add(taskId);
      return newCheckedSet;
    });
  }, []);

  const handleClearAllChecked = useCallback(
    () => setCheckedTasksIdSet(new Set()),
    [],
  );

  const handleCheckAll = useCallback(() => {
    if (isAllChecked) return handleClearAllChecked();
    else if (!isAllChecked) {
      const AllTasksId = tasks?.map((task) => task.id);
      setCheckedTasksIdSet(new Set(AllTasksId));
    }
  }, [tasks, isAllChecked, handleClearAllChecked]);

  return (
    <CheckTaskContext
      value={{
        checkedTasksIdSet,
        handleCheckTask,
        isAllChecked,
        handleCheckAll,
        handleClearAllChecked,
      }}
    >
      {children}
    </CheckTaskContext>
  );
}

function useCheckTask() {
  const values = use(CheckTaskContext);
  if (!values)
    throw new Error("checkTask context is being used out side of his scope");
  return values;
}

export default CheckTaskProvider;
export { useCheckTask };
