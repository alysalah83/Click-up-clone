import express from "express";
import {
  countQuerySchema,
  createWorkspaceFlowSchema,
  createWorkspaceSchema,
  idParamsSchema,
  updateWorkspaceSchema,
} from "@clickup/shared";
import {
  createWorkspace,
  createWorkspaceFlow,
  deleteWorkspace,
  getWorkspace,
  getWorkspaces,
  updateWorkspace,
} from "../controllers/workspace.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate({ body: createWorkspaceSchema }), createWorkspace);
router.post("/flow", validate({ body: createWorkspaceFlowSchema }), createWorkspaceFlow);
router.get("/", validate({ query: countQuerySchema }), getWorkspaces);
router.get("/:id", validate({ params: idParamsSchema }), getWorkspace);
router.patch("/:id", validate({ params: idParamsSchema, body: updateWorkspaceSchema }), updateWorkspace);
router.delete("/:id", validate({ params: idParamsSchema }), deleteWorkspace);

export default router;
