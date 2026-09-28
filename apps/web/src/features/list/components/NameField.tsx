"use client";

import RenameForm from "@/shared/components/RenameForm";
import { memo, startTransition, useOptimistic } from "react";
import { useList } from "./ListContext";
import Link from "next/link";
import { updateList } from "../actions/update-list.action";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";

function NameField() {
  const {
    workspaceId,
    list: { name, id },
    isRenameOpen,
    handleToggleIsRenameOpen,
  } = useList();

  const [optimisticName, setOptimisticName] = useOptimistic(name);

  const handleRenameList = (newName: string) => {
    handleToggleIsRenameOpen();

    startTransition(async () => {
      setOptimisticName(newName);

      const state = await updateList(workspaceId, id, { name: newName });
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
      onSave={handleRenameList}
    />
  ) : (
    <Link href={`/home/lists/${id}/board`} className="w-full">
      <span className="grow-0 truncate text-sm font-medium">
        {optimisticName}
      </span>
    </Link>
  );
}

export default memo(NameField);
