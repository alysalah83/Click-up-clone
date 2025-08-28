import mongoose from "mongoose";
import { toJSONPlugin } from "../toJSONPlugin.js";

const avatarSchema = new mongoose.Schema(
  {
    icon: { type: String, required: [true, "avatar icon is required"] },
    color: { type: String, required: [true, "avatar color is required"] },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, unique: false, required: [true, "name is required"] },
    avatar: { type: avatarSchema, required: [true, "avatar is required"] },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is not authorized"],
    },
  },
  { timestamps: true }
);

workspaceSchema.plugin(toJSONPlugin);

export const Workspace = mongoose.model("Workspace", workspaceSchema);
