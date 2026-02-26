import express from "express";

import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import {
  createStatus,
  getStatuses,
  getStatusTasksCount,
} from "../controllers/status.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createStatus);
router.get("/list/:listId", getStatuses);
router.get("/statusCounts", getStatusTasksCount);

export default router;
