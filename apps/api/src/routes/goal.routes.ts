import express from "express";
import {
  createGoalSchema,
  createGoalTargetSchema,
  goalTargetParamsSchema,
  goalTargetTaskParamsSchema,
  goalTargetTasksSchema,
  goalsQuerySchema,
  idParamsSchema,
  updateGoalSchema,
  updateGoalTargetSchema,
} from "@clickup/shared";
import * as c from "../controllers/goal.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** /api/goals: goals, their targets (key results) and the tasks linked to task targets. */
const router = express.Router();
router.use(authMiddleware);

router.get("/", validate({ query: goalsQuerySchema }), c.getGoals);
router.post("/", validate({ body: createGoalSchema }), c.createGoal);
router.get("/:id", validate({ params: idParamsSchema }), c.getGoal);
router.patch("/:id", validate({ params: idParamsSchema, body: updateGoalSchema }), c.updateGoal);
router.delete("/:id", validate({ params: idParamsSchema }), c.deleteGoal);

router.post("/:id/targets", validate({ params: idParamsSchema, body: createGoalTargetSchema }), c.createTarget);
router.patch(
  "/:id/targets/:targetId",
  validate({ params: goalTargetParamsSchema, body: updateGoalTargetSchema }),
  c.updateTarget,
);
router.delete("/:id/targets/:targetId", validate({ params: goalTargetParamsSchema }), c.deleteTarget);
router.post(
  "/:id/targets/:targetId/tasks",
  validate({ params: goalTargetParamsSchema, body: goalTargetTasksSchema }),
  c.linkTasks,
);
router.delete(
  "/:id/targets/:targetId/tasks/:taskId",
  validate({ params: goalTargetTaskParamsSchema }),
  c.unlinkTask,
);

export default router;

/** Mounted on /api/tasks: GET /:id/goals (the goals a task counts toward). */
export const taskGoalsRouter = express.Router();
taskGoalsRouter.use(authMiddleware);
taskGoalsRouter.get("/:id/goals", validate({ params: idParamsSchema }), c.getTaskGoals);
