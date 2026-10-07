"use client";

import { useModal } from "@/shared/ui/ModalCompound";
import { useWorkspace } from "@/features/workspace/contexts/WorkspaceProvider";
import ImportWizard from "./ImportWizard";

/** "Import (CSV / Trello)" in a space's settings menu: the wizard, targeting that space. */
function SpaceImportModalBody() {
  const { id } = useWorkspace();
  const { closeModal } = useModal();
  return <ImportWizard defaultWorkspaceId={id} onClose={closeModal} />;
}

export default SpaceImportModalBody;
