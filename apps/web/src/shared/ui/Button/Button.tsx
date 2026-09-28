import clsx from "clsx";
import { StylesSizes } from "@/shared/types/index.types";
import { memo, ReactNode } from "react";
import MiniSpinner from "../MiniSpinner";

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
  const buttonClasses = clsx(
    "capitalize transition duration-300 text-nowrap",
    stretch ? "w-full flex justify-center" : "w-fit",
    {
      "bg-neutral-800 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900":
        type === "primary",
      "bg-neutral-100  dark:bg-neutral-925 border border-neutral-400 dark:border-neutral-800 text-neutral-500 dark:text-neutral-300":
        type === "secondary",
      "bg-red-600 text-red-100 dark:bg-red-500 dark:text-red-50":
        type === "delete",
      "bg-indigo-600 text-indigo-50": type === "colored",
    },
    {
      "cursor-pointer": !pending,
      "hover:bg-neutral-700 dark:hover:bg-neutral-300":
        type === "primary" && !pending,
      "hover:bg-neutral-200 dark:hover:bg-neutral-900":
        type === "secondary" && !pending,
      "hover:bg-red-800": type === "delete" && !pending,
      "hover:bg-indigo-700": type === "colored" && !pending,

      "disabled:cursor-not-allowed": disabled && !pending,
      "disabled:bg-neutral-300 dark:disabled:bg-neutral-800":
        type === "secondary" && disabled,
      "disabled:bg-neutral-600 dark:disabled:bg-neutral-500":
        type === "primary" && disabled && !pending,
      "disabled:bg-indigo-900": type === "colored" && disabled,

      "cursor-default": pending,
      "flex justify-center": type === "delete" && pending,
      "bg-neutral-600 dark:bg-neutral-500": type === "primary" && pending,
      "bg-indigo-800": type === "colored" && pending,
    },
    {
      "text-xs font-semibold px-2 py-1": size === "small",
      "text-xs font-semibold px-3 py-1": size === "smallWithMidPadding",
      "text-sm font-semibold px-3 py-2": size === "medium",
      "text-base font-bold px-6 py-2": size === "large",
    },
    {
      "rounded-md": rounded === "small",
      "rounded-lg": rounded === "medium",
      "rounded-xl": rounded === "large",
      "rounded-full": rounded === "full",
    },
    extraClasses,
  );

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
