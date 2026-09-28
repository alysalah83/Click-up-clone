import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import "./config/env.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import listsRoutes from "./routes/list.routes.js";
import taskRoutes from "./routes/task.routes.js";
import userRoutes from "./routes/user.routes.js";
import statusRoutes from "./routes/status.routes.js";
import internalRoutes from "./routes/internal.routes.js";
import { globalErrorHandler } from "./lib/middlewares/error.middleware.js";
import { catchAsync } from "./lib/utils/catchAsync.js";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.use(
  cors({
    origin: ["http://localhost:3000", "https://click-up-clone-two.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(cookieParser());

// Used by the web app to wake the serverless function and the Neon compute before login.
app.get(
  "/health",
  catchAsync(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true });
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/internal", internalRoutes);
app.use(globalErrorHandler);

export default app;
