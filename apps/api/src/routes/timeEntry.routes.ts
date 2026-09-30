import express from "express";
import {
  createManualTimeEntrySchema,
  startTimerSchema,
  timeEntriesQuerySchema,
  timeEntryParamsSchema,
} from "@clickup/shared";
import * as c from "../controllers/timeEntry.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** /api/time-entries: time tracking on tasks (one running timer per user). */
const router = express.Router();
router.use(authMiddleware);
router.get("/", validate({ query: timeEntriesQuerySchema }), c.listTimeEntries);
router.post("/start", validate({ body: startTimerSchema }), c.start);
router.post("/manual", validate({ body: createManualTimeEntrySchema }), c.addManual);
router.post("/:id/stop", validate({ params: timeEntryParamsSchema }), c.stop);
router.delete("/:id", validate({ params: timeEntryParamsSchema }), c.remove);

export default router;
