import express from "express";
import {
  createChecklistItemSchema,
  createChecklistSchema,
  createSubtaskSchema,
  createTagSchema,
  idParamsSchema,
  taskTagParamsSchema,
  updateChecklistItemSchema,
  updateChecklistSchema,
  updateDescriptionSchema,
  updateTagSchema,
  workspaceIdParamsSchema,
} from "@clickup/shared";
import * as c from "../controllers/taskDetail.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const id = validate({ params: idParamsSchema });

/** Mounted on /api/tasks next to the task routes: the task page and its parts. */
export const taskDetailRouter = express.Router();
taskDetailRouter.use(authMiddleware);
taskDetailRouter.get("/:id", id, c.getTaskDetail);
taskDetailRouter.patch(
  "/:id/description",
  validate({ params: idParamsSchema, body: updateDescriptionSchema }),
  c.updateDescription,
);
taskDetailRouter.post(
  "/:id/subtasks",
  validate({ params: idParamsSchema, body: createSubtaskSchema }),
  c.createSubtask,
);
taskDetailRouter.post(
  "/:id/checklists",
  validate({ params: idParamsSchema, body: createChecklistSchema }),
  c.createChecklist,
);
taskDetailRouter.put(
  "/:id/tags/:tagId",
  validate({ params: taskTagParamsSchema }),
  c.addTagToTask,
);
taskDetailRouter.delete(
  "/:id/tags/:tagId",
  validate({ params: taskTagParamsSchema }),
  c.removeTagFromTask,
);

/** /api/checklists */
export const checklistRouter = express.Router();
checklistRouter.use(authMiddleware);
checklistRouter.patch(
  "/:id",
  validate({ params: idParamsSchema, body: updateChecklistSchema }),
  c.updateChecklist,
);
checklistRouter.delete("/:id", id, c.deleteChecklist);
checklistRouter.post(
  "/:id/items",
  validate({ params: idParamsSchema, body: createChecklistItemSchema }),
  c.createChecklistItem,
);

/** /api/checklist-items */
export const checklistItemRouter = express.Router();
checklistItemRouter.use(authMiddleware);
checklistItemRouter.patch(
  "/:id",
  validate({ params: idParamsSchema, body: updateChecklistItemSchema }),
  c.updateChecklistItem,
);
checklistItemRouter.delete("/:id", id, c.deleteChecklistItem);

/** /api/tags (workspace tags live under /api/workspaces/:workspaceId/tags) */
export const tagRouter = express.Router();
tagRouter.use(authMiddleware);
tagRouter.patch(
  "/:id",
  validate({ params: idParamsSchema, body: updateTagSchema }),
  c.updateTag,
);
tagRouter.delete("/:id", id, c.deleteTag);

export const workspaceTagsRouter = express.Router({ mergeParams: true });
workspaceTagsRouter.use(authMiddleware);
workspaceTagsRouter.get(
  "/",
  validate({ params: workspaceIdParamsSchema }),
  c.listTags,
);
workspaceTagsRouter.post(
  "/",
  validate({ params: workspaceIdParamsSchema, body: createTagSchema }),
  c.createTag,
);
