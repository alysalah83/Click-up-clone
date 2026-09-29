import { z } from "zod";

export const idSchema = z.uuid();

export const idParamsSchema = z.object({ id: idSchema });
export const listIdParamsSchema = z.object({ listId: idSchema });
export const workspaceIdParamsSchema = z.object({ workspaceId: idSchema });
export const listInWorkspaceParamsSchema = z.object({ listId: idSchema, workspaceId: idSchema });

export const booleanStringSchema = z.enum(["true", "false"]);
export const countQuerySchema = z.object({ count: booleanStringSchema.optional() });

export const workspacesQuerySchema = z.object({
  count: booleanStringSchema.optional(),
  include: z.enum(["lists"]).optional(),
});

export const listsQuerySchema = z.object({
  count: booleanStringSchema.optional(),
  withCounts: booleanStringSchema.optional(),
});

export const prioritySchema = z.enum(["urgent", "high", "normal", "low", "none"]);
export const sortOrderSchema = z.enum(["asc", "desc"]);

/** Sort params arrive as `?status=asc`; an empty value means "not sorted by this". */
export const optionalSortOrderSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  sortOrderSchema.optional(),
);

export type Priority = z.infer<typeof prioritySchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
