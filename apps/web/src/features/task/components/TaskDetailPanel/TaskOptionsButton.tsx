import TaskDetailPanel from "@/features/task/components/TaskDetailPanel/TaskDetailPanel";
import { Task } from "@/features/task/types";
import { ButtonIcon } from "@/shared/ui/Button";
import Modal, { ModalContent, ModalTrigger } from "@/shared/ui/ModalCompound";

interface TaskOptionsButton {
  task: Task;
  buttonSize?: number;
}

function TaskOptionsButton({ task, buttonSize = 3 }: TaskOptionsButton) {
  return (
    <Modal>
      <ModalTrigger>
        <ButtonIcon
          size={buttonSize}
          icon="setting"
          ariaLabel="open task panel"
        />
      </ModalTrigger>
      <ModalContent contentYPosition="withTopMargin">
        <TaskDetailPanel task={task} />
      </ModalContent>
    </Modal>
  );
}

export default TaskOptionsButton;
