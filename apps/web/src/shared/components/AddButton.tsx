import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import ButtonIcon from "../ui/Button/ButtonIcon";
import { memo } from "react";

interface AddButtonProps {
  toolTipMessage: string;
  ariaLabel: string;
  onClick?: () => void;
}

function AddButton({ toolTipMessage, ariaLabel, onClick }: AddButtonProps) {
  return (
    <ToolTip>
      <ToolTipMessage>{toolTipMessage}</ToolTipMessage>
      <ToolTipTrigger>
        <ButtonIcon
          icon="plus"
          onClick={onClick}
          size={3}
          ariaLabel={ariaLabel}
        />
      </ToolTipTrigger>
    </ToolTip>
  );
}

export default memo(AddButton);
