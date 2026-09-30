import express from "express";
import {
  createSavedViewSchema,
  idParamsSchema,
  listIdParamsSchema,
  updateSavedViewSchema,
} from "@clickup/shared";
import {
  createSavedView,
  deleteSavedView,
  getSavedViews,
  updateSavedView,
} from "../controllers/savedView.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/list/:listId", validate({ params: listIdParamsSchema }), getSavedViews);
router.post("/", validate({ body: createSavedViewSchema }), createSavedView);
router.patch("/:id", validate({ params: idParamsSchema, body: updateSavedViewSchema }), updateSavedView);
router.delete("/:id", validate({ params: idParamsSchema }), deleteSavedView);

export default router;
