import express from "express";
import { importPayloadSchema } from "@clickup/shared";
import * as c from "../controllers/import.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** /api/imports: create a list from a parsed CSV file or Trello board. */
const router = express.Router();
router.use(authMiddleware);

router.post("/", validate({ body: importPayloadSchema }), c.importList);

export default router;
