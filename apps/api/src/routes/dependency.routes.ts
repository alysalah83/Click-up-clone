import express from "express";
import { dependenciesQuerySchema, dependencyParamsSchema, taskDependencySchema } from "@clickup/shared";
import * as c from "../controllers/dependency.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

/** /api/dependencies: "blocked by" links between tasks. */
export const dependenciesRouter = express.Router();
dependenciesRouter.use(authMiddleware);
dependenciesRouter.get("/", validate({ query: dependenciesQuerySchema }), c.listDependencies);
dependenciesRouter.post("/", validate({ body: taskDependencySchema }), c.addDependency);
dependenciesRouter.delete("/:taskId/:dependsOnId", validate({ params: dependencyParamsSchema }), c.removeDependency);
