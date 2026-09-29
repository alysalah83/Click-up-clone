import express from "express";
import {
  bulkDeleteTasksSchema,
  bulkUpdateTasksSchema,
  createTaskSchema,
  idParamsSchema,
  listIdParamsSchema,
  priorityCountsQuerySchema,
  setAssigneesSchema,
  tasksQuerySchema,
  updateTaskSchema,
} from "@clickup/shared";
import {
  createTask,
  deleteManyTasks,
  deleteTask,
  getTasks,
  getTasksPriorityCounts,
  getTotalAndCompleteTasksCount,
  setTaskAssignees,
  updateManyTasks,
  updateTask,
} from "../controllers/task.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate({ body: createTaskSchema }), createTask);
router.get("/priorityCounts", validate({ query: priorityCountsQuerySchema }), getTasksPriorityCounts);
router.get("/", validate({ query: tasksQuerySchema }), getTasks);
router.get(
  "/:listId/completeAndTotalTasksCounts",
  validate({ params: listIdParamsSchema }),
  getTotalAndCompleteTasksCount,
);
router.patch("/bulk", validate({ body: bulkUpdateTasksSchema }), updateManyTasks);
router.patch("/:id", validate({ params: idParamsSchema, body: updateTaskSchema }), updateTask);
router.put("/:id/assignees", validate({ params: idParamsSchema, body: setAssigneesSchema }), setTaskAssignees);
router.delete("/:id", validate({ params: idParamsSchema }), deleteTask);
router.delete(
  "/:listId/bulk",
  validate({ params: listIdParamsSchema, body: bulkDeleteTasksSchema }),
  deleteManyTasks,
);

export default router;
