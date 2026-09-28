import CheckBox from "@/shared/ui/CheckBox";
import { useCheckTask } from "../../context/CheckTaskProvider";
import { memo } from "react";
import { useTask } from "../../context/TaskProvider";

function CheckBoxSlot({
  isTaskRowHovered,
  sortNum,
}: {
  isTaskRowHovered: boolean;
  sortNum: number;
}) {
  const { checkedTasksIdSet, handleCheckTask } = useCheckTask();
  const {
    task: { id },
    isTempTask,
  } = useTask();

  const isTaskChecked = checkedTasksIdSet.has(id);

  return (
    <div className="col-span-1 flex items-center justify-center border-r border-neutral-300 dark:border-neutral-700">
      {isTaskChecked || isTaskRowHovered ? (
        <CheckBox
          checked={isTaskChecked}
          onCheckedChange={handleCheckTask.bind(null, id)}
          disabled={isTempTask}
        />
      ) : (
        <span className="tabular-nums">{sortNum}</span>
      )}
    </div>
  );
}

export default memo(CheckBoxSlot);
