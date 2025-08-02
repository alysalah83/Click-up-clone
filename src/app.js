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


app.use(cors({
  origin: [
    'http://localhost:3000',
    "https://click-up-clone-two.vercel.app"
  ],
  credentials: true
}))


app.use(express.json());

let isConnected = false;

const ensureConnection = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

app.use(async (req, res, next) => {
  try {
    await ensureConnection();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/tasks", taskRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
