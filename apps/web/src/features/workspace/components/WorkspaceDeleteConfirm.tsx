"use client";

import DeleteConfirm from "@/shared/components/DeleteConfirm";
import { useWorkspace } from "../contexts/WorkspaceProvider";
import { useParams } from "next/navigation";
import { LIST_ID_RESERVED_ROUTES } from "@/shared/constants/layout";
import { deleteWorkspace } from "../actions";

function WorkspaceDeleteConfirm() {
  const { id, name } = useWorkspace();

  const { listId } = useParams<{ listId?: string }>();
  let activeListId: string | undefined | null = listId;
  if (LIST_ID_RESERVED_ROUTES.has(listId)) activeListId = null;

  return (
    <DeleteConfirm
      deleteAction={() =>
        deleteWorkspace({
          workspaceId: id,
          activeListId,
        })
      }
      deletedName={name}
    />
  );
}

export default WorkspaceDeleteConfirm;
