import express from "express";
import {
  applyTaskTemplateSchema,
  idParamsSchema,
  saveTaskAsTemplateSchema,
  taskTemplatesQuerySchema,
  updateTaskTemplateSchema,
} from "@clickup/shared";
import * as c from "../controllers/taskTemplate.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** /api/task-templates: save a task as a template, manage templates, create tasks from them. */
const router = express.Router();
router.use(authMiddleware);

router.get("/", validate({ query: taskTemplatesQuerySchema }), c.getTemplates);
router.post("/from-task", validate({ body: saveTaskAsTemplateSchema }), c.saveTaskAsTemplate);
router.patch("/:id", validate({ params: idParamsSchema, body: updateTaskTemplateSchema }), c.updateTemplate);
router.delete("/:id", validate({ params: idParamsSchema }), c.deleteTemplate);
router.post("/:id/apply", validate({ params: idParamsSchema, body: applyTaskTemplateSchema }), c.applyTemplate);

export default router;
