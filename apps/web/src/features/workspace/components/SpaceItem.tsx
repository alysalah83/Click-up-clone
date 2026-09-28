import WorkspaceItem from "./WorkspaceItem";
import ListProvider from "@/features/list/components/ListContext";
import WorkspaceProvider from "../contexts/WorkspaceProvider";
import RenameProvider from "../contexts/RenameProvider";
import { listServices } from "@/features/list/services/list.service";
import { Workspace } from "../types";
import { OpenAvatarPickerProvider } from "../contexts/OpenAvatarProvider";
import { ListItem } from "@/features/list";
import Modal, { ModalContent, ModalTrigger } from "@/shared/ui/ModalCompound";
import RowAddNew from "@/shared/components/RowAddNew";
import CreateListForm from "@/features/list/components/CreateListForm";

interface SpaceItemProps {
  workspace: Workspace;
}

async function SpaceItem({ workspace }: SpaceItemProps) {
  const lists = await listServices.getWorkspaceLists(workspace.id);

  const haveLists = lists.length > 0;

  return (
    <li className="flex flex-col gap-2">
      <WorkspaceProvider workspace={workspace}>
        <RenameProvider>
          <OpenAvatarPickerProvider>
            <WorkspaceItem workspace={workspace} />
          </OpenAvatarPickerProvider>
        </RenameProvider>
      </WorkspaceProvider>

      <menu className="ml-auto flex w-[92%] flex-col gap-2 border-l border-neutral-300 pl-3 dark:border-neutral-700">
        {haveLists &&
          lists.map((list) => (
            <ListProvider workspaceId={workspace.id} list={list} key={list.id}>
              <ListItem list={list} />
            </ListProvider>
          ))}
        <Modal>
          <ModalTrigger>
            <RowAddNew label="New List" size="small" />
          </ModalTrigger>
          <ModalContent>
            <CreateListForm workspaceId={workspace.id} />
          </ModalContent>
        </Modal>
      </menu>
    </li>
  );
}

export default SpaceItem;
