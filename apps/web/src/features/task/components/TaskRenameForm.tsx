"use client";

import RenameForm from "@/shared/components/RenameForm";
import { useParams } from "next/navigation";
import { useUpdateTask } from "../hooks/useUpdateTask";
import { useTask } from "../context/TaskProvider";

function TaskRenameForm() {
  const {
    task: { name, id },
    toggleIsRenameOpen,
  } = useTask();
  const { updateTask } = useUpdateTask();

  const handleRenameList = (newName: string) => {
    updateTask({ taskId: id, updateTaskInput: { name: newName } });

    toggleIsRenameOpen();
  };

  return (
    <RenameForm
      initialName={name}
      onClose={toggleIsRenameOpen}
      onSave={handleRenameList}
    />
  );
}

export default TaskRenameForm;
