import express from "express";
import {
  createStatusSchema,
  idParamsSchema,
  listIdParamsSchema,
  updateStatusSchema,
} from "@clickup/shared";
import {
  createStatus,
  deleteStatus,
  getStatuses,
  getStatusTasksCount,
  updateStatus,
} from "../controllers/status.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate({ body: createStatusSchema }), createStatus);
router.get("/list/:listId", validate({ params: listIdParamsSchema }), getStatuses);
router.get("/statusCounts", getStatusTasksCount);
router.patch("/:id", validate({ params: idParamsSchema, body: updateStatusSchema }), updateStatus);
router.delete("/:id", validate({ params: idParamsSchema }), deleteStatus);

export default router;
