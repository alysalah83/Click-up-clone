"use client";

import CreateForm from "@/shared/ui/CreateForm";
import { useState } from "react";
import { createList } from "../actions/create-list.action";

function CreateListForm({ workspaceId }: { workspaceId: string }) {
  const [nameValue, setNameValue] = useState("");

  const createListWithWorkspaceId = createList.bind(null, workspaceId);

  return (
    <CreateForm
      name={nameValue}
      theAction={createListWithWorkspaceId}
      actionFor="list"
      headerTitle="Create List"
      headerText="All lists live inside a Space. Use a list to group related tasks and keep work organized."
      inputLabel="Name"
      inputPlaceholder="e.g. Project, List of items, Campaign"
      setInputValue={setNameValue}
      inputValue={nameValue}
    />
  );
}

export default CreateListForm;
