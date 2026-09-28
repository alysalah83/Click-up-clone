import express from "express";
import {
  createWorkspace,
  deleteWorkspace,
  updateWorkspace,
  getWorkspaces,
  createWorkspaceFlow,
} from "../controllers/workspace.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createWorkspace);
router.post("/flow", createWorkspaceFlow);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspaces);
router.patch("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

export default router;
