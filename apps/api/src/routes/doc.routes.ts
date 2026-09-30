import express from "express";
import { createDocSchema, docsQuerySchema, idParamsSchema, updateDocSchema } from "@clickup/shared";
import { createDoc, deleteDoc, getDoc, getDocs, updateDoc } from "../controllers/doc.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", validate({ query: docsQuerySchema }), getDocs);
router.get("/:id", validate({ params: idParamsSchema }), getDoc);
router.post("/", validate({ body: createDocSchema }), createDoc);
router.patch("/:id", validate({ params: idParamsSchema, body: updateDocSchema }), updateDoc);
router.delete("/:id", validate({ params: idParamsSchema }), deleteDoc);

export default router;
