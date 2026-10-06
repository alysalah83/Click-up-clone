import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import "./config/env.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import listsRoutes from "./routes/list.routes.js";
import timeEntryRoutes from "./routes/timeEntry.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import taskRoutes from "./routes/task.routes.js";
import userRoutes from "./routes/user.routes.js";
import statusRoutes from "./routes/status.routes.js";
import savedViewRoutes from "./routes/savedView.routes.js";
import docRoutes from "./routes/doc.routes.js";
import whiteboardRoutes from "./routes/whiteboard.routes.js";
import sprintRoutes from "./routes/sprint.routes.js";
import { invitesRouter, membersRouter } from "./routes/member.routes.js";
import { dependenciesRouter } from "./routes/dependency.routes.js";
import { commentsRouter, taskCommentsRouter } from "./routes/comment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { myWorkRouter, searchRouter } from "./routes/home.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { automationsRouter, listAutomationsRouter } from "./routes/automation.routes.js";
import internalRoutes from "./routes/internal.routes.js";
import {
  checklistItemRouter,
  checklistRouter,
  tagRouter,
  taskDetailRouter,
  workspaceTagsRouter,
} from "./routes/taskDetail.routes.js";
import { globalErrorHandler } from "./lib/middlewares/error.middleware.js";
import { catchAsync } from "./lib/utils/catchAsync.js";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(helmet());
// Whiteboard scenes are bigger than any other payload; parsed first, the global parser then skips them.
app.use("/api/whiteboards", express.json({ limit: "2mb" }));
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
app.use("/api/workspaces/:workspaceId/tags", workspaceTagsRouter);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/lists", listAutomationsRouter);
app.use("/api/automations", automationsRouter);
app.use("/api/lists", listsRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks", taskDetailRouter);
app.use("/api/tasks", taskCommentsRouter);
app.use("/api/tasks", aiRoutes);
app.use("/api/comments", commentsRouter);
app.use("/api/dependencies", dependenciesRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/my-work", myWorkRouter);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/search", searchRouter);
app.use("/api/checklists", checklistRouter);
app.use("/api/checklist-items", checklistItemRouter);
app.use("/api/tags", tagRouter);
app.use("/api/statuses", statusRoutes);
app.use("/api/saved-views", savedViewRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/whiteboards", whiteboardRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/members", membersRouter);
app.use("/api/invites", invitesRouter);
app.use("/internal", internalRoutes);
app.use(globalErrorHandler);

export default app;
