import express from "express";
import {
  getUserById,
  loginUser,
  registerUser,
  getUser,
  registerGuest,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getUser);
router.get("/:id", authMiddleware, getUserById);
router.post("/register/user", registerUser);
router.post("/register/guest", registerGuest);
router.post("/login", loginUser);

export default router;
