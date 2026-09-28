import z from "zod";
import { createStatusSchema } from "./schema/status.schema";

interface Status {
  name: string;
  listId: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  id: string;
  order: number;
  userId: string;
}

type CreateStatusInputs = z.infer<typeof createStatusSchema>;

export type { CreateStatusInputs, Status };
