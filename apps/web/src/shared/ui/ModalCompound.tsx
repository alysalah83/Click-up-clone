"use client";

import { createContext, ReactNode, use, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ButtonIcon from "./Button/ButtonIcon";
import { AnimatePresence, motion } from "motion/react";

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
}: {
  children: ReactNode;
  initialOpen?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(initialOpen);

  const toggleModal = () => setIsModalOpen((cur) => !cur);
  const closeModal = () => setIsModalOpen(false);

  return (
    <ModalContext value={{ isModalOpen, toggleModal, closeModal }}>
      {children}
    </ModalContext>
  );
}

function ModalTrigger({ children }: { children: ReactNode }) {
  const { toggleModal } = useModal();

  return (
    <span onClick={toggleModal} aria-label="container for the modal trigger">
      {children}
    </span>
  );
}

function ModalContent({
  children,
  contentYPosition = "center",
}: {
  children: ReactNode;
  contentYPosition?: ContentYPosition;
}) {
  const { isModalOpen, closeModal } = useModal();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-40 bg-neutral-950/50"
          onClick={closeModal}
        />
      )}
      {isModalOpen && (
        <motion.div
          key="modal"
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`fixed z-50 m-4 h-fit w-fit overflow-hidden rounded-lg bg-neutral-300 dark:bg-neutral-800 ${
            contentYPosition === "withTopMargin"
              ? "top-48 left-1/2 -translate-x-1/2"
              : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          }`}
        >
          <span className="absolute top-6 right-6 z-50">
            <ButtonIcon
              icon="close"
              ariaLabel="modal close button"
              padding="small"
              onClick={closeModal}
            />
          </span>
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function useModal() {
  const values = use(ModalContext);
  if (!values)
    throw new Error("the Modal context is being used outside of his scope");
  return values;
}

export { Modal, ModalTrigger, ModalContent };

export default Modal;
