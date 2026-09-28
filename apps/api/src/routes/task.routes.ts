import express from "express";
import {
  createTask,
  deleteTask,
  updateTask,
  deleteManyTasks,
  updateManyTasks,
  getTasksPriorityCounts,
  getTasks,
  getTotalAndCompleteTasksCount,
} from "../controllers/task.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTask);
router.get("/priorityCounts", getTasksPriorityCounts);
router.get("/", getTasks);
router.get(
  "/:listId/completeAndTotalTasksCounts",
  getTotalAndCompleteTasksCount,
);
router.patch("/bulk", updateManyTasks);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
router.delete("/:listId/bulk", deleteManyTasks);

export default router;
