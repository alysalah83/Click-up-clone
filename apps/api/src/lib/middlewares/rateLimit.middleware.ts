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
  // Only failed attempts count, so a user who logs in often is never locked out.
  skipSuccessfulRequests: true,
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

/**
 * Public form submissions: the web proxy forwards the visitor's IP as X-Client-Ip, so each
 * visitor gets FORM_SUBMISSIONS_PER_MINUTE per form, and a form takes at most 10x that overall.
 */
const formSlug = (req: Request) => String(req.params?.slug ?? "");
export const formSubmitLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: env.FORM_SUBMISSIONS_PER_MINUTE,
  keyGenerator: (req) => `${formSlug(req)}:${String(req.get("x-client-ip") ?? "anonymous").slice(0, 64)}`,
});
export const formSubmitGlobalLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: env.FORM_SUBMISSIONS_PER_MINUTE * 10,
  keyGenerator: formSlug,
});

/**
 * Public share links (read-only): SHARE_VIEWS_PER_MINUTE requests per visitor (X-Client-Ip from
 * the web proxy) per link, and at most 10x that per link overall.
 */
const shareToken = (req: Request) => String(req.params?.token ?? "");
export const shareViewLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: env.SHARE_VIEWS_PER_MINUTE,
  keyGenerator: (req) => `${shareToken(req)}:${String(req.get("x-client-ip") ?? "anonymous").slice(0, 64)}`,
});
export const shareViewGlobalLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: env.SHARE_VIEWS_PER_MINUTE * 10,
  keyGenerator: shareToken,
});
