import mongoose from "mongoose";
import { toJSONPlugin } from "../toJSONPlugin.js";

const ListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
  },
  { timestamps: true }
);

ListSchema.plugin(toJSONPlugin);

export const List = mongoose.model("List", ListSchema);
