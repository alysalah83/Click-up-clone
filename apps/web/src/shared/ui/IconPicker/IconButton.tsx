import { IconType } from "react-icons";
import { IconsRegistry } from "./types";

function IconButton({
  iconName,
  Icon,
  isSelected,
  setSelectedIcon,
}: {
  iconName: IconsRegistry;
  Icon: IconType;
  isSelected: boolean;
  setSelectedIcon: (icon: IconsRegistry) => void;
}) {
  return (
    <button
      className={`cursor-pointer rounded-lg p-1 transition duration-300 ${isSelected ? "bg-neutral-900/10 dark:bg-neutral-200/10" : "hover:bg-neutral-900/10 active:bg-neutral-900/10 dark:hover:bg-neutral-200/10 dark:active:bg-neutral-200/10"}`}
      aria-label={`${iconName} Avatar`}
      type="button"
      onClick={() => (isSelected ? null : setSelectedIcon(iconName))}
    >
      <Icon className="size-6 fill-neutral-600 text-neutral-600 dark:fill-neutral-400 dark:text-neutral-400" />
    </button>
  );
}

export default IconButton;
