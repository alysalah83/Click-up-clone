"use client";

import RenameForm from "@/shared/components/RenameForm";
import { memo, startTransition, useOptimistic } from "react";
import { useRename } from "../contexts/RenameProvider";
import { useWorkspace } from "../contexts/WorkspaceProvider";
import { updateWorkspace } from "../actions";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";

function NameField() {
  const { isRenameOpen, handleToggleIsRenameOpen } = useRename();
  const { id, name } = useWorkspace();

  const [optimisticName, setOptimisticName] = useOptimistic(name);

  const handleRenameWorkspace = (newName: string) => {
    handleToggleIsRenameOpen();

    startTransition(async () => {
      setOptimisticName(newName);
      const state = await updateWorkspace(id, { name: newName });

      if (state.status === "error") {
        setOptimisticName(name);
        window.toast?.error(formatErrorForToast(state.error), 7);
        handleToggleIsRenameOpen();
      }
    });
  };

  return isRenameOpen ? (
    <RenameForm
      initialName={optimisticName}
      onClose={handleToggleIsRenameOpen}
      onSave={handleRenameWorkspace}
    />
  ) : (
    <span className="grow-0 truncate text-sm font-medium">
      {optimisticName}
    </span>
  );
}

export default memo(NameField);
