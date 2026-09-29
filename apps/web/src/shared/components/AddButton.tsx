import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTip";
import ButtonIcon from "../ui/Button/ButtonIcon";
import { memo } from "react";

interface AddButtonProps {
  toolTipMessage: string;
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
}

function AddButton({
  toolTipMessage,
  ariaLabel,
  onClick,
  disabled,
}: AddButtonProps) {
  return (
    <ToolTip>
      <ToolTipMessage>{toolTipMessage}</ToolTipMessage>
      <ToolTipTrigger>
        <ButtonIcon
          icon="plus"
          onClick={onClick}
          size={3}
          ariaLabel={ariaLabel}
          disabled={disabled}
        />
      </ToolTipTrigger>
    </ToolTip>
  );
}

export default memo(AddButton);
