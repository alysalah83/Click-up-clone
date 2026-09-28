import { StylesSizes } from "@/shared/types/index.types";

interface MiniSpinnerProps {
  width?: StylesSizes | "xLarge";
  padding?: string;
  bgColor?: string;
}

function MiniSpinner({
  width = "small",
  padding = "p-1",
  bgColor = "bg-neutral-100 dark:bg-neutral-200",
}: MiniSpinnerProps) {
  const spinnerWidthClass = {
    small: "w-5",
    medium: "w-6",
    large: "w-9",
    xLarge: "w-12",
  };

  return (
    <div className={spinnerWidthClass[width]}>
      <span className={`loader block w-full ${padding} ${bgColor}`} />
    </div>
  );
}

export default MiniSpinner;
