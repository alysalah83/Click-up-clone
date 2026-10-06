import express from "express";
import type { Request, Response } from "express";
import {
  createFormSchema,
  formSlugParamsSchema,
  idParamsSchema,
  listIdParamsSchema,
  submitFormSchema,
  updateFormSchema,
  type CreateFormInput,
  type SubmitFormInput,
  type UpdateFormInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";
import { formSubmitGlobalLimiter, formSubmitLimiter } from "../lib/middlewares/rateLimit.middleware.js";
import * as service from "../services/form.service.js";

/** Mounted on /api/lists: GET|POST /:listId/forms. */
export const listFormsRouter = express.Router();
listFormsRouter.use("/:listId/forms", authMiddleware);
listFormsRouter.get(
  "/:listId/forms",
  validate({ params: listIdParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { listId } = req.params as { listId: string };
    res.status(200).json(await service.listForms(req.userId, listId));
  }),
);
listFormsRouter.post(
  "/:listId/forms",
  validate({ params: listIdParamsSchema, body: createFormSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { listId } = req.params as { listId: string };
    res.status(201).json(await service.createForm(req.userId, listId, req.body as CreateFormInput));
  }),
);

/** /api/forms: edit and delete a form. */
export const formsRouter = express.Router();
formsRouter.use(authMiddleware);
formsRouter.patch(
  "/:id",
  validate({ params: idParamsSchema, body: updateFormSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    res.status(200).json(await service.updateForm(req.userId, id, req.body as UpdateFormInput));
  }),
);
formsRouter.delete(
  "/:id",
  validate({ params: idParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    res.status(200).json(await service.deleteForm(req.userId, id));
  }),
);

/** /api/public/forms: no login. The form by its link token, and submissions (rate limited). */
export const publicFormsRouter = express.Router();
publicFormsRouter.get(
  "/:slug",
  validate({ params: formSlugParamsSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params as { slug: string };
    res.status(200).json(await service.getPublicForm(slug));
  }),
);
publicFormsRouter.post(
  "/:slug/submissions",
  validate({ params: formSlugParamsSchema }),
  formSubmitGlobalLimiter,
  formSubmitLimiter,
  validate({ body: submitFormSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params as { slug: string };
    res.status(201).json(await service.submitForm(slug, req.body as SubmitFormInput));
  }),
);
