import express from "express";
import {
  createWhiteboardSchema,
  idParamsSchema,
  updateWhiteboardSchema,
  whiteboardTaskSchema,
  whiteboardsQuerySchema,
} from "@clickup/shared";
import {
  createTaskFromNote,
  createWhiteboard,
  deleteWhiteboard,
  getWhiteboard,
  getWhiteboards,
  updateWhiteboard,
} from "../controllers/whiteboard.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", validate({ query: whiteboardsQuerySchema }), getWhiteboards);
router.get("/:id", validate({ params: idParamsSchema }), getWhiteboard);
router.post("/", validate({ body: createWhiteboardSchema }), createWhiteboard);
router.patch("/:id", validate({ params: idParamsSchema, body: updateWhiteboardSchema }), updateWhiteboard);
router.delete("/:id", validate({ params: idParamsSchema }), deleteWhiteboard);
router.post("/:id/tasks", validate({ params: idParamsSchema, body: whiteboardTaskSchema }), createTaskFromNote);

export default router;
