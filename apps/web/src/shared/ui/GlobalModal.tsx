"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import ButtonIcon from "./Button/ButtonIcon";

type ContentYPosition = "withTopMargin" | "center";

interface ModalOptions {
  content: ReactNode;
  contentYPosition?: ContentYPosition;
}

interface ModalState extends ModalOptions {
  id: string;
  isExiting: boolean;
}

declare global {
  interface Window {
    modal?: {
      open: (options: ModalOptions) => string;
      close: (id?: string) => void;
      closeAll: () => void;
    };
  }
}

function GlobalModal() {
  const [modals, setModals] = useState<ModalState[]>([]);
  const exitTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const closeModal = useCallback((id?: string) => {
    setModals((prev) => {
      const targetId = id ?? prev[prev.length - 1]?.id;
      if (!targetId) return prev;

      const timeout = setTimeout(() => {
        setModals((cur) => cur.filter((m) => m.id !== targetId));
        exitTimeouts.current.delete(targetId);
      }, 200);

      exitTimeouts.current.set(targetId, timeout);

      return prev.map((m) =>
        m.id === targetId ? { ...m, isExiting: true } : m,
      );
    });
  }, []);

  const closeAll = useCallback(() => {
    setModals((prev) => {
      prev.forEach((m) => {
        const timeout = setTimeout(() => {
          setModals((cur) => cur.filter((modal) => modal.id !== m.id));
          exitTimeouts.current.delete(m.id);
        }, 200);
        exitTimeouts.current.set(m.id, timeout);
      });
      return prev.map((m) => ({ ...m, isExiting: true }));
    });
  }, []);

  const openModal = useCallback((options: ModalOptions): string => {
    const id = `${Date.now()}-${Math.random()}`;
    setModals((prev) => [...prev, { ...options, id, isExiting: false }]);
    return id;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.modal = {
      open: openModal,
      close: closeModal,
      closeAll,
    };

    return () => {
      window.modal = undefined;
      exitTimeouts.current.forEach((t) => clearTimeout(t));
      exitTimeouts.current.clear();
    };
  }, [openModal, closeModal, closeAll]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {modals.map((modal, index) => (
        <ModalLayer
          key={modal.id}
          modal={modal}
          zIndex={40 + index * 10}
          onClose={() => closeModal(modal.id)}
        />
      ))}
    </AnimatePresence>,
    document.body,
  );
}

interface ModalLayerProps {
  modal: ModalState;
  zIndex: number;
  onClose: () => void;
}

function ModalLayer({ modal, zIndex, onClose }: ModalLayerProps) {
  const { content, contentYPosition = "center", isExiting } = modal;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key={`backdrop-${modal.id}`}
        initial={{ opacity: 0 }}
        animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.15 }}
        style={{ zIndex }}
        className="fixed inset-0 bg-neutral-950/50"
        onClick={onClose}
      />

      {/* Modal panel */}
      <motion.div
        key={`panel-${modal.id}`}
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={
          isExiting
            ? { scale: 0.96, opacity: 0, y: 8 }
            : { scale: 1, opacity: 1, y: 0 }
        }
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ zIndex: zIndex + 1 }}
        className={`fixed m-4 h-fit w-fit overflow-hidden rounded-lg bg-neutral-300 dark:bg-neutral-800 ${
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
            onClick={onClose}
          />
        </span>
        {content}
      </motion.div>
    </>
  );
}

export default GlobalModal;
