import express from "express";
import { createSprintSchema, listIdParamsSchema } from "@clickup/shared";
import { completeSprint, createSprint, getSprint, getSprintReport } from "../controllers/sprint.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** /api/sprints */
const router = express.Router();

router.use(authMiddleware);

router.post("/", validate({ body: createSprintSchema }), createSprint);
router.get("/:listId", validate({ params: listIdParamsSchema }), getSprint);
router.get("/:listId/report", validate({ params: listIdParamsSchema }), getSprintReport);
router.post("/:listId/complete", validate({ params: listIdParamsSchema }), completeSprint);

export default router;
