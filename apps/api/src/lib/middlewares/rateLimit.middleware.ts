import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { AppError } from "../errors/appError.js";
import { env } from "../../config/env.js";

// Every request reaches the API from the web app's server, so all requests share one IP.
// Limits are therefore keyed by email, or global for anonymous guest sign-ups (spec §0.3).

const handler = (_req: Request, _res: Response, next: NextFunction) =>
  next(new AppError("Too many attempts, please try again later", 429));

const emailKey = (req: Request) =>
  String(req.body?.email ?? "").trim().toLowerCase() || "missing-email";

const shared = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler,
  validate: { xForwardedForHeader: false },
} as const;

export const loginLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_ATTEMPTS_PER_15_MIN,
  keyGenerator: emailKey,
});

export const registerLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: emailKey,
});

export const guestLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: env.GUEST_SIGNUPS_PER_MINUTE,
  keyGenerator: () => "all-guests",
});
