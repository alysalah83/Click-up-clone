import { Modal, ModalContent, ModalTrigger } from "@/shared/ui/ModalCompound";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import {
  Menu,
  MenuContent,
  MenuTrigger,
  useMenu,
} from "@/shared/ui/Menu/MenuCompound";
import { OptionItem } from "@/shared/types/types";

function OptionsMenuItem({ option }: { option: OptionItem }) {
  const { icon, label, color, display, action } = option;
  const { toggleMenu } = useMenu();
  const Icon = ICONS_MAP[icon];
  const iconClasses = color
    ? `size-4 ${color}`
    : "size-4 text-neutral-600 dark:text-neutral-400";
  const labelClasses = color
    ? `text-sm font-medium ${color}`
    : "text-sm font-medium text-neutral-800 dark:text-neutral-200";
  const itemClasses =
    "flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left transition duration-300 hover:bg-neutral-600/20 dark:hover:bg-neutral-500/20";
  const itemContent = (
    <>
      <span>
        <Icon className={iconClasses} />
      </span>
      <span className={labelClasses}>{label}</span>
    </>
  );

  if (action) {
    return (
      <li>
        <button
          type="button"
          className={itemClasses}
          onClick={() => {
            action();
            toggleMenu();
          }}
        >
          {itemContent}
        </button>
      </li>
    );
  }

  if (display && display.uiForAction === "modal") {
    const { ActionComponent } = display;
    return (
      <li>
        <Modal>
          <ModalTrigger>
            <button type="button" className={itemClasses} onClick={toggleMenu}>
              {itemContent}
            </button>
          </ModalTrigger>
          <ModalContent contentYPosition="withTopMargin">
            <ActionComponent />
          </ModalContent>
        </Modal>
      </li>
    );
  }

  if (display && display.uiForAction === "menu") {
    const { ActionComponent } = display;
    return (
      <li className="w-full">
        <Menu>
          <MenuTrigger>
            <button type="button" className={itemClasses}>
              {itemContent}
            </button>
          </MenuTrigger>
          <MenuContent>
            <ActionComponent />
          </MenuContent>
        </Menu>
      </li>
    );
  }

  return null;
}

export default OptionsMenuItem;
