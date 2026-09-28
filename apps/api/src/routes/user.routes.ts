import express from "express";
import { loginSchema, registerSchema, updateMeSchema } from "@clickup/shared";
import {
  getUser,
  loginUser,
  registerGuest,
  registerUser,
  updateUser,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";
import {
  guestLimiter,
  loginLimiter,
  registerLimiter,
} from "../lib/middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getUser);
router.post("/register/user", registerLimiter, validate({ body: registerSchema }), registerUser);
router.post("/register/guest", guestLimiter, registerGuest);
router.post("/login", loginLimiter, validate({ body: loginSchema }), loginUser);
router.patch("/", authMiddleware, validate({ body: updateMeSchema }), updateUser);

export default router;
