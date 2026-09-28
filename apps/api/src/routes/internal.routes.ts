import { createHash, timingSafeEqual } from "node:crypto";
import express from "express";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { UnauthorizedError } from "../lib/errors/index.js";
import { env } from "../config/env.js";
import { deleteStaleGuests } from "../services/guestCleanup.service.js";

const router = express.Router();

// Hashing gives both sides the same length, so timingSafeEqual never throws or leaks the length.
const sha256 = (value: string) => createHash("sha256").update(value).digest();
const isCronSecret = (header: string | undefined, secret: string | undefined) =>
  Boolean(secret) && timingSafeEqual(sha256(header ?? ""), sha256(`Bearer ${secret}`));

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
router.get(
  "/cron/cleanup-guests",
  catchAsync(async (req, res) => {
    if (!isCronSecret(req.headers.authorization, env.CRON_SECRET))
      throw new UnauthorizedError("Invalid cron secret");
    res.status(200).json({ deletedGuests: await deleteStaleGuests() });
  }),
);

export default router;
