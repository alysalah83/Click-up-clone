import express from "express";
import { inviteTokenParamsSchema } from "@clickup/shared";
import { acceptInvite, getPeople, previewInvite } from "../controllers/member.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** GET /api/members: everyone across my workspaces (Teams page). */
export const membersRouter = express.Router();
membersRouter.get("/", authMiddleware, getPeople);

/** Invite links: the preview is public so a logged-out visitor can see what they are joining. */
export const invitesRouter = express.Router();
invitesRouter.get("/:token", validate({ params: inviteTokenParamsSchema }), previewInvite);
invitesRouter.post(
  "/:token/accept",
  authMiddleware,
  validate({ params: inviteTokenParamsSchema }),
  acceptInvite,
);
