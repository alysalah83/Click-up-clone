import mongoose from "mongoose";
import { toJSONPlugin } from "../toJSONPlugin.js";

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "task name is required"],
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: [true, "list id is required to create task"],
    },
    status: {
      type: String,
      default: "toDo",
      enum: {
        values: ["toDo", "inProgress", "complete"],
        message: "{VALUE} not supported",
      },
    },
    priority: {
      type: String,
      default: "none",
      enum: {
        values: ["urgent", "high", "normal", "low", "none"],
        message: "{VALUE} not supported",
      },
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

taskSchema.plugin(toJSONPlugin);

export const Task = mongoose.model("Task", taskSchema);
