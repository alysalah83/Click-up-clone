import express from "express";
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  deleteWorkspace,
  updateWorkspace,
  getWorkspacesCount,
} from "../controllers/workspaceController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getUserWorkspaces);
router.get("/count", getWorkspacesCount);
router.get("/:id", getWorkspaceById);
router.post("/", createWorkspace);
router.patch("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

export default router;
