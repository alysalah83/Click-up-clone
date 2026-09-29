import { StylesSizes } from "@/shared/types/index.types";
import { memo, ReactNode } from "react";
import MiniSpinner from "../MiniSpinner";
import { getButtonClasses } from "./buttonClasses";

interface ButtonProps {
  children: ReactNode;
  ariaLabel: string;
  type?: "primary" | "secondary" | "delete" | "colored";
  rounded?: StylesSizes | "full";
  stretch?: boolean;
  disabled?: boolean;
  pending?: boolean;
  pendingSpinnerWidth?: StylesSizes;
  size?: StylesSizes | "smallWithMidPadding";
  buttonFor?: "submit" | "button";
  extraClasses?: string;
  onClick?: ((e: React.MouseEvent<HTMLButtonElement>) => void) | (() => void);
}

function Button({
  children,
  disabled,
  pending,
  ariaLabel,
  type = "primary",
  rounded = "medium",
  pendingSpinnerWidth = "small",
  stretch = false,
  extraClasses = "",
  buttonFor = "submit",
  size = "medium",
  onClick,
}: ButtonProps) {
  const buttonClasses = getButtonClasses({
    type,
    rounded,
    stretch,
    size,
    disabled,
    pending,
    extraClasses,
  });

  return (
    <button
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      type={buttonFor}
      className={buttonClasses}
    >
      {pending ? <MiniSpinner width={pendingSpinnerWidth} /> : children}
    </button>
  );
}

export default memo(Button);
