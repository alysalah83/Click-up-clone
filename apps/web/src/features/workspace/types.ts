import z from "zod";

import { Avatar } from "@/shared/ui/AvatarPicker/avatarPicker.types";
import {
  createAvatarSchema,
  createWorkspaceSchema,
  updateWorkSpaceSchema,
} from "./schema/workspace-actions.schema";

type WorkspaceWithoutAvatar = {
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  avatarId: string;
};

type Workspace = WorkspaceWithoutAvatar & { avatar: Avatar };

type WorkspaceWithLists = Workspace & {
  lists: { id: string; name: string; workspaceId: string; userId: string; createdAt: Date; updatedAt: Date }[];
};

type CreateWorkspaceInputs = z.infer<typeof createWorkspaceSchema>;
type CreateAvatarInput = z.infer<typeof createAvatarSchema>;
type UpdateWorkspaceInput = z.infer<typeof updateWorkSpaceSchema>;

export type {
  Workspace,
  WorkspaceWithLists,
  CreateWorkspaceInputs,
  UpdateWorkspaceInput,
  CreateAvatarInput,
};
