"use client";

import { Avatar } from "@/shared/ui/AvatarPicker";
import { getRandomColor } from "@/shared/ui/AvatarPicker/helper";
import ColorsPicker from "@/shared/ui/ColorPicker/ColorsPicker";
import ControlledInput from "@/shared/ui/Input/ControlledInput";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { useState } from "react";
import { useAddStatus } from "../hooks/useAddStatus";
import { useParams } from "next/navigation";
import { ButtonIcon } from "@/shared/ui/Button";
import { ICONS_MAP } from "@/shared/icons/icons-map";

function AddStatus() {
  const [selectedColor, setSelectedColor] = useState(() => getRandomColor());
  const [name, setName] = useState("");
  const { listId } = useParams<{ listId: string }>();
  const { addStatus } = useAddStatus();

  const reset = () => {
    setSelectedColor(getRandomColor());
    setName("");
  };

  return (
    <form className="flex h-fit shrink-0 flex-col gap-3 rounded-lg border border-neutral-400 px-3 py-2 dark:border-neutral-700">
      <label className="flex items-center gap-1" htmlFor="status name">
        <ICONS_MAP.plus className="size-3 text-neutral-400" />
        <h2 className="py-1 text-sm font-bold tracking-wide text-neutral-400">
          Add Group
        </h2>
      </label>
      <div className="flex items-center gap-2">
        <Menu menuMargin={16}>
          <MenuTrigger containerClasses="flex justify-center">
            <Avatar avatarColor={selectedColor} size="small" />
          </MenuTrigger>
          <MenuContent>
            <ColorsPicker
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
            />
          </MenuContent>
        </Menu>
        <ControlledInput
          inputStyle="secondary"
          name="status name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Status Name"
        />
        <div className="justify-self-end">
          <ButtonIcon
            icon="checkMark"
            ariaLabel="add new status group button"
            btnType="submit"
            size={4.5}
            onClick={(e) => {
              e.preventDefault();
              addStatus({
                listId,
                name,
                bgColor: selectedColor,
                iconColor: selectedColor,
                icon: "inProgress",
              });
              reset();
            }}
          />
        </div>
      </div>
    </form>
  );
}

export default AddStatus;
