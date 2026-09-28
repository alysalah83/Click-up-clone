import express from "express";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { UnauthorizedError } from "../lib/errors/index.js";
import { env } from "../config/env.js";
import { deleteStaleGuests } from "../services/guestCleanup.service.js";

const router = express.Router();

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
router.get(
  "/cron/cleanup-guests",
  catchAsync(async (req, res) => {
    if (!env.CRON_SECRET || req.headers.authorization !== `Bearer ${env.CRON_SECRET}`)
      throw new UnauthorizedError("Invalid cron secret");
    res.status(200).json({ deletedGuests: await deleteStaleGuests() });
  }),
);

export default router;
