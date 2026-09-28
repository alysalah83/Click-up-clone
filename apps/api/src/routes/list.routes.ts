import express from "express";
import {
  createList,
  getListsByWorkspace,
  deleteList,
  updateList,
  getLists,
  getList,
  checkListOwnership,
  getLatestList,
} from "../controllers/list.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getLists);
router.get("/latest", getLatestList);
router.get("/workspace/:workspaceId", getListsByWorkspace);
router.get("/:listId", getList);
router.get("/:listId/belong-to/:workspaceId", checkListOwnership);
router.post("/", createList);
router.patch("/:id", updateList);
router.delete("/:id", deleteList);

export default router;
