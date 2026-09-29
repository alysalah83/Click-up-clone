"use client";

import { Dialog } from "radix-ui";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
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
  onClose,
}: {
  children: ReactNode;
  initialOpen?: boolean;
  onClose?: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(initialOpen);

  const closeModal = () => {
    setIsModalOpen(false);
    onClose?.();
  };
  const toggleModal = () => (isModalOpen ? closeModal() : setIsModalOpen(true));

  return (
    <ModalContext value={{ isModalOpen, toggleModal, closeModal }}>
      <Dialog.Root open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : closeModal())}>
        {children}
      </Dialog.Root>
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
    <Dialog.Trigger asChild>
      <span
        ref={wrapperRef}
        tabIndex={-1}
        className="outline-none"
        onFocus={(e) => {
          if (e.target !== wrapperRef.current) return;
          wrapperRef.current
            ?.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
            ?.focus();
        }}
      >
        {children}
      </span>
    </Dialog.Trigger>
  );
}

function ModalContent({
  children,
  contentYPosition = "center",
}: {
  children: ReactNode;
  contentYPosition?: ContentYPosition;
}) {
  const { closeModal } = useModal();
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-40 bg-neutral-950/50",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        )}
      />
      <Dialog.Content
        aria-describedby={undefined}
        className={cn(
          "bg-popover fixed left-1/2 z-50 m-4 h-fit w-fit -translate-x-1/2 overflow-hidden rounded-lg outline-none",
          contentYPosition === "withTopMargin" ? "top-48" : "top-1/2 -translate-y-1/2",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        )}
      >
        <Dialog.Title className="sr-only">Dialog</Dialog.Title>
        {children}
        <span className="absolute top-6 right-6 z-50">
          <ButtonIcon icon="close" ariaLabel="modal close button" padding="small" onClick={closeModal} />
        </span>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("the Modal context is being used outside of his scope");
  return context;
}

export { Modal, ModalTrigger, ModalContent };
export default Modal;
