import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import listsRoutes from "./routes/listRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://localhost:5000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

await connectDB();

app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
