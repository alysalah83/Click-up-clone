import { workspaceServices } from "../services/workspace.service";
import SpaceItem from "./SpaceItem";

async function SpacesList() {
  const workspaces = await workspaceServices.getWorkspacesWithLists();

  if (workspaces?.length === 0 || !workspaces) return;

  return (
    <menu className="flex flex-col gap-4">
      {workspaces.map((workspace) => (
        <SpaceItem workspace={workspace} lists={workspace.lists} key={workspace.id} />
      ))}
    </menu>
  );
}

export default SpacesList;
