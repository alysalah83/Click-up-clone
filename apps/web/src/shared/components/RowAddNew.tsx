import ButtonIcon from "../ui/Button/ButtonIcon";
import { hoverElementClasses } from "@/shared/constants/styles";

interface RowAddNewProps {
  label: string;
  size?: "small" | "medium";
  onClick?: () => void;
}

function RowAddNew({ label, size = "medium", onClick }: RowAddNewProps) {
  return (
    <div
      className={`flex max-w-2xs items-center rounded-lg ${size === "medium" ? "gap-2 px-2 py-1" : "px-1 py-0.5"} opacity-60 transition duration-300 ${hoverElementClasses}`}
      onClick={onClick}
    >
      <ButtonIcon
        icon="plus"
        size={size === "medium" ? 4 : 3}
        ariaLabel="add new space button"
      />
      <h4
        className={
          size === "medium" ? "text-sm font-medium" : "text-xs font-bold"
        }
      >
        {label}
      </h4>
    </div>
  );
}

export default RowAddNew;
