import express from "express";
import type { Request, Response } from "express";
import { dashboardBurndownQuerySchema } from "@clickup/shared";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/dashboard.service.js";

/** /api/dashboard */
const router = express.Router();
router.use(authMiddleware);

router.get(
  "/summary",
  catchAsync(async (req: Request, res: Response) => {
    res.status(200).json(await service.summary(req.userId));
  }),
);
router.get(
  "/burndown",
  validate({ query: dashboardBurndownQuerySchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { listId } = req.query as { listId: string };
    res.status(200).json(await service.burndown(req.userId, listId));
  }),
);

export default router;
