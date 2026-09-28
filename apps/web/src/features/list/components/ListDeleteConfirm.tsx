"use client";

import { useParams } from "next/navigation";
import { useList } from "./ListContext";
import OptionsDeleteConfirm from "@/shared/components/DeleteConfirm";
import { deleteList } from "../actions/delete-list.action";

function ListDeleteConfirm() {
  const {
    workspaceId,
    list: { id: listId, name },
  } = useList();
  const { listId: ListIdParam } = useParams<{ listId: string }>();
  const isCurrentListIdDeleted = listId === ListIdParam;

  const deleteListWithIds = deleteList.bind(
    null,
    workspaceId,
    listId,
    isCurrentListIdDeleted,
  );

  return (
    <OptionsDeleteConfirm deleteAction={deleteListWithIds} deletedName={name} />
  );
}

export default ListDeleteConfirm;
