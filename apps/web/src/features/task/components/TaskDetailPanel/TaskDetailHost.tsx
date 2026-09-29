"use client";

import Modal, { ModalContent } from "@/shared/ui/ModalCompound";
import { useTaskParam } from "@/features/taskDetail/hooks/useTaskParam";
import TaskDetailPanel from "./TaskDetailPanel";

/** Renders the task page for `?task=<id>`; mounted once per list route (board, table, list, calendar). */
function TaskDetailHost() {
  const { taskId, openTask, closeTask } = useTaskParam();

  return (
    <Modal open={!!taskId} onOpenChange={(open) => !open && closeTask()}>
      <ModalContent contentYPosition="center" title="Task details">
        {taskId && (
          <TaskDetailPanel key={taskId} taskId={taskId} onOpenTask={openTask} />
        )}
      </ModalContent>
    </Modal>
  );
}

export default TaskDetailHost;
