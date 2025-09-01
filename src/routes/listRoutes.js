import express from "express";
import {
  createList,
  getListsByWorkspaceId,
  deleteList,
  updateList,
  getLists,
  getLatestListId,
  getIsListFromWorkspace,
} from "../controllers/listController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/latest", getLatestListId);
router.get("/:workspaceId", getListsByWorkspaceId);
router.get("/", getLists);
router.get(`/:listId/workspace/:workspaceId`, getIsListFromWorkspace);
router.post("/", createList);
router.patch("/:id", updateList);
router.delete("/:id", deleteList);

export default router;
