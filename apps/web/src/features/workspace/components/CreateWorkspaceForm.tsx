"use client";

import { useState } from "react";
import CreateForm from "@/shared/ui/CreateForm";
import AvatarWithPickerMenu from "@/shared/ui/AvatarPicker/AvatarWithPickerMenu";
import { useAvatarPickerStates } from "@/shared/ui/AvatarPicker";
import { createWorkspace } from "../actions";

function CreateWorkspaceForm() {
  const [nameValue, setNameValue] = useState("");
  const {
    avatarLetter,
    selectedColor,
    selectedIcon,
    setSelectedColor,
    setSelectedIcon,
  } = useAvatarPickerStates({ label: nameValue });

  const createWorkspaceWithAvatar = createWorkspace.bind(null, {
    icon: selectedIcon || avatarLetter,
    color: selectedColor,
  });

  return (
    <CreateForm
      name={nameValue}
      theAction={createWorkspaceWithAvatar}
      actionFor="workspace"
      headerTitle="Create a Space"
      headerText="A Space represents teams, departments, or groups, each with its own
        Lists, workflows, and settings."
      inputLabel="Icon & name"
      inputPlaceholder="e.g. Marketing, Engineering, HR"
      setInputValue={setNameValue}
      inputValue={nameValue}
    >
      <AvatarWithPickerMenu
        curAvatarIcon={selectedIcon || avatarLetter}
        selectedIcon={selectedIcon}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        setSelectedIcon={setSelectedIcon}
      />
    </CreateForm>
  );
}

export default CreateWorkspaceForm;
