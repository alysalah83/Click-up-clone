import express from "express";
import type { Request, Response } from "express";
import {
  createCustomFieldSchema,
  customFieldValueParamsSchema,
  idParamsSchema,
  listIdParamsSchema,
  setCustomFieldValueSchema,
  updateCustomFieldSchema,
  type CreateCustomFieldInput,
  type SetCustomFieldValueInput,
  type UpdateCustomFieldInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";
import * as service from "../services/customField.service.js";

/** Mounted on /api/lists: GET|POST /:listId/custom-fields. */
export const listCustomFieldsRouter = express.Router();
listCustomFieldsRouter.use("/:listId/custom-fields", authMiddleware);
listCustomFieldsRouter.get(
  "/:listId/custom-fields",
  validate({ params: listIdParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { listId } = req.params as { listId: string };
    res.status(200).json(await service.listCustomFields(req.userId, listId));
  }),
);
listCustomFieldsRouter.post(
  "/:listId/custom-fields",
  validate({ params: listIdParamsSchema, body: createCustomFieldSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { listId } = req.params as { listId: string };
    res.status(201).json(await service.createCustomField(req.userId, listId, req.body as CreateCustomFieldInput));
  }),
);

/** /api/custom-fields: rename, edit options or formula, delete. */
export const customFieldsRouter = express.Router();
customFieldsRouter.use(authMiddleware);
customFieldsRouter.patch(
  "/:id",
  validate({ params: idParamsSchema, body: updateCustomFieldSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    res.status(200).json(await service.updateCustomField(req.userId, id, req.body as UpdateCustomFieldInput));
  }),
);
customFieldsRouter.delete(
  "/:id",
  validate({ params: idParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    res.status(200).json(await service.deleteCustomField(req.userId, id));
  }),
);

/** Mounted on /api/tasks: PUT /:id/custom-fields/:fieldId sets (or with null clears) a value. */
export const taskCustomFieldsRouter = express.Router();
taskCustomFieldsRouter.use("/:id/custom-fields", authMiddleware);
taskCustomFieldsRouter.put(
  "/:id/custom-fields/:fieldId",
  validate({ params: customFieldValueParamsSchema, body: setCustomFieldValueSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { id, fieldId } = req.params as { id: string; fieldId: string };
    const { value } = req.body as SetCustomFieldValueInput;
    res.status(200).json(await service.setCustomFieldValue(req.userId, id, fieldId, value));
  }),
);
