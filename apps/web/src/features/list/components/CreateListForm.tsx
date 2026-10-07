"use client";

import CreateForm from "@/shared/ui/CreateForm";
import { useState } from "react";
import { createList } from "../actions/create-list.action";
import ImportFromCreateList from "@/features/import/components/ImportFromCreateList";

function CreateListForm({ workspaceId }: { workspaceId: string }) {
  const [nameValue, setNameValue] = useState("");

  const createListWithWorkspaceId = createList.bind(null, workspaceId);

  return (
    <div>
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
      <ImportFromCreateList workspaceId={workspaceId} />
    </div>
  );
}

export default CreateListForm;
