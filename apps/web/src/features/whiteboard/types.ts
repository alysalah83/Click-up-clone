export type WhiteboardSummary = {
  id: string;
  workspaceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Whiteboard = WhiteboardSummary & {
  /** Serialized scene, see `parseScene`. Empty for a new board. */
  scene: string;
  createdById: string;
};

export type WhiteboardPatch = Partial<Pick<Whiteboard, "title" | "scene">>;
