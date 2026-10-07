"use client";

import { Upload } from "lucide-react";
import Modal, { ModalContent, ModalTrigger, useModal } from "@/shared/ui/ModalCompound";
import ImportWizard from "./ImportWizard";

function WizardInModal({ workspaceId, onDone }: { workspaceId: string; onDone: () => void }) {
  const { closeModal } = useModal();
  return (
    <ImportWizard
      defaultWorkspaceId={workspaceId}
      onClose={() => {
        closeModal();
        onDone();
      }}
    />
  );
}

/** The "Create list" dialog's footer link: opens the import wizard, then closes both dialogs when done. */
function ImportFromCreateList({ workspaceId }: { workspaceId: string }) {
  const createList = useModal();
  return (
    <div className="flex items-center gap-2 border-t border-neutral-200 px-6 py-3 text-sm text-neutral-500 dark:border-neutral-800">
      <Upload className="size-3.5" />
      <span>Have tasks elsewhere?</span>
      <Modal>
        <ModalTrigger>
          <button type="button" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">
            Import (CSV / Trello)
          </button>
        </ModalTrigger>
        <ModalContent contentYPosition="center" title="Import tasks">
          <WizardInModal workspaceId={workspaceId} onDone={createList.closeModal} />
        </ModalContent>
      </Modal>
    </div>
  );
}

export default ImportFromCreateList;
