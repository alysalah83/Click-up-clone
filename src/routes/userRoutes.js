import express from "express";
import {
  getUserById,
  validateToken,
  loginUser,
  registerUser,
  getUser,
} from "../controllers/UserController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", authMiddleware, getUser);
router.post("/validate", authMiddleware, validateToken);
router.get("/:id", authMiddleware, getUserById);

export default router;
