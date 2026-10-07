import WorkspaceItem from "./WorkspaceItem";
import ListProvider from "@/features/list/components/ListContext";
import WorkspaceProvider from "../contexts/WorkspaceProvider";
import RenameProvider from "../contexts/RenameProvider";
import { Workspace } from "../types";
import { List } from "@/features/list/types";
import { OpenAvatarPickerProvider } from "../contexts/OpenAvatarProvider";
import { ListItem } from "@/features/list";
import Modal, { ModalContent, ModalTrigger } from "@/shared/ui/ModalCompound";
import RowAddNew from "@/shared/components/RowAddNew";
import CreateListForm from "@/features/list/components/CreateListForm";
import DocsTree from "@/features/docs/components/DocsTree";
import WhiteboardsTree from "@/features/whiteboard/components/WhiteboardsTree";
import ChannelsTree from "@/features/chat/components/ChannelsTree";
import SprintsTree from "@/features/sprint/components/SprintsTree";
import { splitSprintLists } from "@/features/sprint/lib";

interface SpaceItemProps {
  workspace: Workspace;
  lists: List[];
}

function SpaceItem({ workspace, lists }: SpaceItemProps) {
  // Sprint lists go into the space's "Sprints" folder; the rest stay plain lists.
  const { sprints, others } = splitSprintLists(lists ?? []); // API may lag web during deploy
  const haveLists = others.length > 0;

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
          others.map((list) => (
            <ListProvider workspaceId={workspace.id} list={list} key={list.id}>
              <ListItem list={list} />
            </ListProvider>
          ))}
        <Modal>
          <ModalTrigger>
            <RowAddNew label="New List" size="small" />
          </ModalTrigger>
          <ModalContent title="Create list">
            <CreateListForm workspaceId={workspace.id} />
          </ModalContent>
        </Modal>
      </menu>
      <SprintsTree workspaceId={workspace.id} sprints={sprints} />
      <ChannelsTree workspaceId={workspace.id} />
      <DocsTree workspaceId={workspace.id} />
      <WhiteboardsTree workspaceId={workspace.id} />
    </li>
  );
}

export default SpaceItem;
