import { workspaceServices } from "../services/workspace.service";
import SpaceItem from "./SpaceItem";

async function SpacesList() {
  const workspaces = await workspaceServices.getWorkspaces();

  if (workspaces?.length === 0 || !workspaces) return;

  return (
    <menu className="flex flex-col gap-4">
      {workspaces.map((workspace) => (
        <SpaceItem workspace={workspace} key={workspace.id} />
      ))}
    </menu>
  );
}

export default SpacesList;
