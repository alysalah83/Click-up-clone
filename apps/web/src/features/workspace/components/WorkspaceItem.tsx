"use client";

import { hoverElementClasses } from "@/shared/constants/styles";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import Modal, { ModalContent, ModalTrigger } from "@/shared/ui/ModalCompound";
import AddButton from "@/shared/components/AddButton";
import CreateListForm from "@/features/list/components/CreateListForm";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import { useRename } from "../contexts/RenameProvider";
import OptionsContent from "./OptionsContent";
import { Workspace } from "../types";
import Avatar from "./Avatar";
import { ICONS_SIZE } from "../consts/workspace.consts";
import NameField from "./NameField";

function WorkspaceItem({ workspace }: { workspace: Workspace }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-2 py-1 transition duration-300 ${hoverElementClasses.replace("cursor-pointer", "cursor-default")}`}
    >
      <ItemHeading />

      <ItemFeatureBtns workspaceId={workspace.id} />
    </div>
  );
}

function ItemHeading() {
  const { isRenameOpen } = useRename();

  return (
    <div
      className={`flex ${isRenameOpen ? "w-full" : "max-w-3/4"} items-center gap-2`}
    >
      <Avatar />
      <NameField />
    </div>
  );
}

function ItemFeatureBtns({ workspaceId }: { workspaceId: string }) {
  const { isRenameOpen } = useRename();
  return (
    !isRenameOpen && (
      <div className="flex items-center gap-1">
        <Menu>
          <MenuTrigger>
            <ToolTip>
              <ToolTipTrigger>
                <ButtonIcon
                  icon="dotsRow"
                  ariaLabel="workspace show more button"
                  size={ICONS_SIZE}
                />
              </ToolTipTrigger>
              <ToolTipMessage>Space settings</ToolTipMessage>
            </ToolTip>
          </MenuTrigger>
          <MenuContent>
            <OptionsContent />
          </MenuContent>
        </Menu>

        <Modal>
          <ModalTrigger>
            <AddButton
              toolTipMessage="Create list"
              ariaLabel="Create list button"
            />
          </ModalTrigger>
          <ModalContent contentYPosition="withTopMargin">
            <CreateListForm workspaceId={workspaceId} />
          </ModalContent>
        </Modal>
      </div>
    )
  );
}

export default WorkspaceItem;
