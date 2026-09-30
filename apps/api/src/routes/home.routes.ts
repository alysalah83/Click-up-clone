import express from "express";
import { myWorkQuerySchema, searchQuerySchema } from "@clickup/shared";
import * as c from "../controllers/home.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** /api/my-work */
export const myWorkRouter = express.Router();
myWorkRouter.use(authMiddleware);
myWorkRouter.get("/", validate({ query: myWorkQuerySchema }), c.myWork);

/** /api/search */
export const searchRouter = express.Router();
searchRouter.use(authMiddleware);
searchRouter.get("/", validate({ query: searchQuerySchema }), c.search);
