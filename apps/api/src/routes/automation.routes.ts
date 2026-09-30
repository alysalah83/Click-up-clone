import express from "express";
import type { Request, Response } from "express";
import {
  createAutomationSchema,
  idParamsSchema,
  listIdParamsSchema,
  updateAutomationSchema,
  type CreateAutomationInput,
  type UpdateAutomationInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";
import * as service from "../services/automation.service.js";

/** Mounted on /api/lists: GET|POST /:listId/automations. */
export const listAutomationsRouter = express.Router();
listAutomationsRouter.use(authMiddleware);
listAutomationsRouter.get(
  "/:listId/automations",
  validate({ params: listIdParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { listId } = req.params as { listId: string };
    res.status(200).json(await service.listAutomations(req.userId, listId));
  }),
);
listAutomationsRouter.post(
  "/:listId/automations",
  validate({ params: listIdParamsSchema, body: createAutomationSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { listId } = req.params as { listId: string };
    res.status(201).json(await service.createAutomation(req.userId, listId, req.body as CreateAutomationInput));
  }),
);

/** /api/automations */
export const automationsRouter = express.Router();
automationsRouter.use(authMiddleware);
automationsRouter.patch(
  "/:id",
  validate({ params: idParamsSchema, body: updateAutomationSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    res.status(200).json(await service.updateAutomation(req.userId, id, req.body as UpdateAutomationInput));
  }),
);
automationsRouter.delete(
  "/:id",
  validate({ params: idParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    res.status(200).json(await service.deleteAutomation(req.userId, id));
  }),
);
