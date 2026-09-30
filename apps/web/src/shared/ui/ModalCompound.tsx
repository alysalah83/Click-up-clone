"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ButtonIcon from "./Button/ButtonIcon";
import { cn } from "@/shared/lib/utils/cn";

interface ModalContextTypes {
  isModalOpen: boolean;
  toggleModal: () => void;
  closeModal: () => void;
}

type ContentYPosition = "withTopMargin" | "center" | null;

const ModalContext = createContext<ModalContextTypes | null>(null);

function Modal({
  children,
  initialOpen = false,
  open: controlledOpen,
  onOpenChange,
  onClose,
}: {
  children: ReactNode;
  initialOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const isModalOpen = isControlled ? controlledOpen : internalOpen;

  const closeModal = () => {
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
    onClose?.();
  };
  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const toggleModal = () => (isModalOpen ? closeModal() : setOpen(true));

  return (
    <ModalContext value={{ isModalOpen, toggleModal, closeModal }}>
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => (open ? setOpen(true) : closeModal())}
      >
        {children}
      </Dialog>
    </ModalContext>
  );
}

function ModalTrigger({ children }: { children: ReactNode }) {
  // A wrapper span (not asChild on the child) because children are often
  // components that do not forward refs (ButtonIcon, Avatar, StatusBadge).
  // Radix restores focus by calling .focus() on the trigger element, which is
  // this wrapper span. A plain span without a tabindex cannot receive focus,
  // so give it tabIndex={-1} (script-focusable, not tab-reachable) and
  // redirect that programmatic focus to the real interactive descendant.
  const wrapperRef = useRef<HTMLSpanElement>(null);

  return (
    <DialogTrigger asChild>
      <span
        ref={wrapperRef}
        tabIndex={-1}
        className="outline-none"
        onFocus={(e) => {
          if (e.target !== wrapperRef.current) return;
          wrapperRef.current
            ?.querySelector<HTMLElement>(
              'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            )
            ?.focus();
        }}
      >
        {children}
      </span>
    </DialogTrigger>
  );
}

function ModalContent({
  children,
  contentYPosition = "center",
  title = "Dialog",
}: {
  children: ReactNode;
  contentYPosition?: ContentYPosition;
  title?: string;
}) {
  const { closeModal } = useModal();
  // Same pointer-vs-keyboard tracking as MenuContent: triggers are often
  // wrapped in a ToolTip that opens on focus, so returning focus to the
  // trigger after a mouse-driven close would pop that tooltip open.
  // Keyboard/Escape closes still return focus to the trigger.
  const wasPointerInteractionRef = useRef(false);
  return (
    <DialogContent
      showCloseButton={false}
      aria-describedby={undefined}
      onOpenAutoFocus={() => {
        // Reset per open/close cycle; default open-focus is left intact.
        wasPointerInteractionRef.current = false;
      }}
      onPointerDown={() => {
        wasPointerInteractionRef.current = true;
      }}
      onPointerDownOutside={() => {
        // A click on the overlay closes the dialog by pointer too.
        wasPointerInteractionRef.current = true;
      }}
      onInteractOutside={(e) => {
        // Toasts (sonner) render outside the dialog; interacting with one
        // must not dismiss the dialog.
        const target = e.target as Element | null;
        if (target?.closest?.("[data-sonner-toaster]")) e.preventDefault();
      }}
      onKeyDown={() => {
        wasPointerInteractionRef.current = false;
      }}
      onCloseAutoFocus={(e) => {
        if (wasPointerInteractionRef.current) e.preventDefault();
      }}
      className={cn(
        "bg-popover m-4 h-fit w-fit max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] -translate-x-1/2 overflow-y-auto gap-0 rounded-2xl border p-0 shadow-2xl sm:max-w-[calc(100vw-1rem)]",
        contentYPosition === "withTopMargin"
          ? "top-48 translate-y-0"
          : "top-1/2 -translate-y-1/2",
      )}
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>
      {children}
      <span className="absolute right-6 top-6 z-50">
        <ButtonIcon
          icon="close"
          ariaLabel="modal close button"
          padding="small"
          onClick={closeModal}
        />
      </span>
    </DialogContent>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context)
    throw new Error("the Modal context is being used outside of his scope");
  return context;
}

export { Modal, ModalTrigger, ModalContent };
export default Modal;
