import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import RowAddNew from "@/shared/components/RowAddNew";
import Modal, { ModalContent, ModalTrigger } from "@/shared/ui/ModalCompound";
import CreateWorkspaceForm from "./CreateWorkspaceForm";
import { ICONS_SIZE } from "../consts/workspace.consts";
import SpacesList from "./SpacesList";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import CreateSpaceFlow from "./CreateSpaceFlow";

async function SpacesSection() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Spaces</h4>
        <Modal>
          <ModalTrigger>
            <ToolTip>
              <ToolTipTrigger>
                <ButtonIcon
                  icon="plus"
                  size={ICONS_SIZE}
                  ariaLabel="add new space button"
                />
              </ToolTipTrigger>
              <ToolTipMessage>Add Space</ToolTipMessage>
            </ToolTip>
          </ModalTrigger>
          <ModalContent contentYPosition="withTopMargin">
            <CreateSpaceFlow />
          </ModalContent>
        </Modal>
      </div>
      <SpacesList />
      <Modal>
        <ModalTrigger>
          <RowAddNew label="New Workspace" />
        </ModalTrigger>
        <ModalContent contentYPosition="withTopMargin">
          <CreateWorkspaceForm />
        </ModalContent>
      </Modal>
    </>
  );
}

export default SpacesSection;
