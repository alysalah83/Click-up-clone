import express from "express";
import { createCommentSchema, idParamsSchema, toggleReactionSchema } from "@clickup/shared";
import * as c from "../controllers/comment.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** Mounted on /api/tasks: GET|POST /:id/comments. */
export const taskCommentsRouter = express.Router();
taskCommentsRouter.use(authMiddleware);
taskCommentsRouter.get("/:id/comments", validate({ params: idParamsSchema }), c.listComments);
taskCommentsRouter.post(
  "/:id/comments",
  validate({ params: idParamsSchema, body: createCommentSchema }),
  c.createComment,
);

/** /api/comments */
export const commentsRouter = express.Router();
commentsRouter.use(authMiddleware);
commentsRouter.delete("/:id", validate({ params: idParamsSchema }), c.deleteComment);
commentsRouter.post(
  "/:id/reactions",
  validate({ params: idParamsSchema, body: toggleReactionSchema }),
  c.toggleReaction,
);
