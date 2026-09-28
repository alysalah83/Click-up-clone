import { ButtonIcon } from "@/shared/ui/Button";
import { useState } from "react";
import CreateTaskRow from "./CreateTaskRow";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";

function AddTaskButton({ cellDate }: { cellDate: Date }) {
  const [isOpen, setIsOpen] = useState(false);
  return isOpen ? (
    <CreateTaskRow onClose={() => setIsOpen(false)} cellDate={cellDate} />
  ) : (
    <ToolTip>
      <ToolTipTrigger>
        <ButtonIcon
          icon="plus"
          ariaLabel="add task"
          bgColor="bg-neutral-500/90"
          iconColor="text-neutral-50 fill-neutral-50"
          onClick={() => setIsOpen(true)}
          size={3}
        />
      </ToolTipTrigger>
      <ToolTipMessage>add task</ToolTipMessage>
    </ToolTip>
  );
}

export default AddTaskButton;
