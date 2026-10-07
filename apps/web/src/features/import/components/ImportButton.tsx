"use client";

import { Upload } from "lucide-react";
import Modal, { ModalContent, ModalTrigger, useModal } from "@/shared/ui/ModalCompound";
import ImportWizard from "./ImportWizard";

function WizardInModal() {
  const { closeModal } = useModal();
  return <ImportWizard onClose={closeModal} />;
}

/** "Import" button of the Lists Overview page. */
function ImportButton() {
  return (
    <Modal>
      <ModalTrigger>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <Upload className="size-3.5" /> Import
        </button>
      </ModalTrigger>
      <ModalContent contentYPosition="center" title="Import tasks">
        <WizardInModal />
      </ModalContent>
    </Modal>
  );
}

export default ImportButton;
