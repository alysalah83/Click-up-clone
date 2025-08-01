import express from "express";
import {
  createTask,
  getTasksByListId,
  deleteTask,
  updateTask,
  deleteManyTasks,
  updateManyTasks,
  getListTasksCount,
  getTasksCount,
  getTasksPriority,
} from "../controllers/taskController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTask);
router.get("/count", getTasksCount);
router.get("/:listId/count", getListTasksCount);
router.get("/priority", getTasksPriority);
router.get("/:listId", getTasksByListId);
router.patch("/bulk", updateManyTasks);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

router.delete("/:listId/bulk", deleteManyTasks);

export default router;
