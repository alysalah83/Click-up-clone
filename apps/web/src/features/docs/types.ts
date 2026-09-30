export type DocSummary = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  updatedAt: string;
};

export type Doc = DocSummary & {
  content: string;
  createdById: string;
  createdAt: string;
};

export type DocPatch = Partial<Pick<Doc, "title" | "icon" | "content" | "parentId">>;

export type DocNode = DocSummary & { children: DocNode[] };
