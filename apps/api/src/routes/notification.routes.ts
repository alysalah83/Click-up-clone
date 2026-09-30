import express from "express";
import { idParamsSchema } from "@clickup/shared";
import * as c from "../controllers/notification.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** /api/notifications */
const router = express.Router();
router.use(authMiddleware);
router.get("/", c.listNotifications);
router.get("/unread-count", c.unreadCount);
router.post("/read-all", c.markAllRead);
router.post("/:id/read", validate({ params: idParamsSchema }), c.markRead);

export default router;
