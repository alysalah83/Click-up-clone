import z from "zod";
import { createListSchema, updateListSchema } from "./schema/list.schema";

interface List {
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
  userId: string;
}

type CreateListInput = z.infer<typeof createListSchema>;
type UpdateListInput = z.infer<typeof updateListSchema>;

type ListWithStatuses = {
  status: {
    name: string;
    id: string;
    userId: string;
    icon: string;
    iconColor: string;
    bgColor: string;
    order: number;
    listId: string;
  }[];
} & {
  name: string;
  workspaceId: string;
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type { CreateListInput, UpdateListInput, ListWithStatuses, List };
