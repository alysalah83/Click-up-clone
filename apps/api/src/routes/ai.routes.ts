import express from "express";
import { idParamsSchema } from "@clickup/shared";
import * as c from "../controllers/ai.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** Mounted on /api/tasks: POST /:id/ai/summarize and /:id/ai/subtasks. */
const router = express.Router();
router.use(authMiddleware);
router.post("/:id/ai/summarize", validate({ params: idParamsSchema }), c.summarize);
router.post("/:id/ai/subtasks", validate({ params: idParamsSchema }), c.suggestSubtasks);

export default router;
