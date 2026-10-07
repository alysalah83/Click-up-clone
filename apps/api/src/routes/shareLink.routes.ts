import express from "express";
import type { Request, Response } from "express";
import {
  sharePageParamsSchema,
  shareResourceParamsSchema,
  shareTaskParamsSchema,
  shareTokenParamsSchema,
  updateShareLinkSchema,
  type ShareResourceType,
  type UpdateShareLinkInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";
import { shareViewGlobalLimiter, shareViewLimiter } from "../lib/middlewares/rateLimit.middleware.js";
import * as service from "../services/shareLink.service.js";

type ResourceParams = { resourceType: ShareResourceType; resourceId: string };

/** /api/share-links/:resourceType/:resourceId: the Share popover (read: any member, change: member+). */
export const shareLinksRouter = express.Router();
shareLinksRouter.use(authMiddleware);
shareLinksRouter.get(
  "/:resourceType/:resourceId",
  validate({ params: shareResourceParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { resourceType, resourceId } = req.params as ResourceParams;
    res.status(200).json(await service.getShareLink(req.userId, resourceType, resourceId));
  }),
);
shareLinksRouter.put(
  "/:resourceType/:resourceId",
  validate({ params: shareResourceParamsSchema, body: updateShareLinkSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { resourceType, resourceId } = req.params as ResourceParams;
    const { isActive } = req.body as UpdateShareLinkInput;
    res.status(200).json({ link: await service.setShareLinkActive(req.userId, resourceType, resourceId, isActive) });
  }),
);
shareLinksRouter.post(
  "/:resourceType/:resourceId/reset",
  validate({ params: shareResourceParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { resourceType, resourceId } = req.params as ResourceParams;
    res.status(200).json({ link: await service.resetShareLink(req.userId, resourceType, resourceId) });
  }),
);

/** /api/public/share/:token: no login, read-only, rate limited per visitor and per link. */
export const publicShareRouter = express.Router();
publicShareRouter.get(
  "/:token",
  validate({ params: shareTokenParamsSchema }),
  shareViewGlobalLimiter,
  shareViewLimiter,
  catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params as { token: string };
    res.status(200).json(await service.getPublicShare(token));
  }),
);
publicShareRouter.get(
  "/:token/tasks/:taskId",
  validate({ params: shareTaskParamsSchema }),
  shareViewGlobalLimiter,
  shareViewLimiter,
  catchAsync(async (req: Request, res: Response) => {
    const { token, taskId } = req.params as { token: string; taskId: string };
    res.status(200).json(await service.getPublicShareTask(token, taskId));
  }),
);
publicShareRouter.get(
  "/:token/pages/:docId",
  validate({ params: sharePageParamsSchema }),
  shareViewGlobalLimiter,
  shareViewLimiter,
  catchAsync(async (req: Request, res: Response) => {
    const { token, docId } = req.params as { token: string; docId: string };
    res.status(200).json(await service.getPublicSharePage(token, docId));
  }),
);
