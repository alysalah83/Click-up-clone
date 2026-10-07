import express from "express";
import {
  createWorkspaceFlowSchema,
  createInviteSchema,
  createWorkspaceSchema,
  idParamsSchema,
  updateMemberCapacitySchema,
  updateMemberRoleSchema,
  workspaceMemberParamsSchema,
  updateWorkspaceSchema,
  workspacesQuerySchema,
} from "@clickup/shared";
import {
  createWorkspace,
  createWorkspaceFlow,
  deleteWorkspace,
  getWorkspace,
  getWorkspaces,
  updateWorkspace,
} from "../controllers/workspace.controller.js";
import {
  createInvite,
  getWorkspaceMembers,
  removeMember,
  updateMemberCapacity,
  updateMemberRole,
} from "../controllers/member.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate({ body: createWorkspaceSchema }), createWorkspace);
router.post("/flow", validate({ body: createWorkspaceFlowSchema }), createWorkspaceFlow);
router.get("/", validate({ query: workspacesQuerySchema }), getWorkspaces);
router.get("/:id", validate({ params: idParamsSchema }), getWorkspace);
router.patch("/:id", validate({ params: idParamsSchema, body: updateWorkspaceSchema }), updateWorkspace);
router.delete("/:id", validate({ params: idParamsSchema }), deleteWorkspace);
router.get("/:id/members", validate({ params: idParamsSchema }), getWorkspaceMembers);
router.patch(
  "/:id/members/:userId",
  validate({ params: workspaceMemberParamsSchema, body: updateMemberRoleSchema }),
  updateMemberRole,
);
router.patch(
  "/:id/members/:userId/capacity",
  validate({ params: workspaceMemberParamsSchema, body: updateMemberCapacitySchema }),
  updateMemberCapacity,
);
router.delete("/:id/members/:userId", validate({ params: workspaceMemberParamsSchema }), removeMember);
router.post("/:id/invites", validate({ params: idParamsSchema, body: createInviteSchema }), createInvite);

export default router;
