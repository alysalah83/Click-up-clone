import { Workspace } from "../models/Workspace.js";
import { List } from "../models/List.js";
import { Task } from "../models/Task.js";

export const createWorkspace = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user.id;

    const workspace = await Workspace.create({ name, avatar, userId });
    res.status(201).json(workspace);
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    res.status(500).json({
      message: "Failed to create workspace",
      error: err.message,
    });
  }
};

export const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    const workspaces = await Workspace.find({ userId });
    res.status(200).json(workspaces);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch workspaces",
      error: err.message,
    });
  }
};

export const getWorkspaceById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const workspace = await Workspace.findOne({
      _id: id,
      userId,
    });

    if (!workspace)
      return res.status(404).json({ message: "Workspace not found" });

    res.status(200).json(workspace);
  } catch (err) {
    if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid workspace ID format" });

    res.status(500).json({
      message: "Failed to get workspace",
      error: err.message,
    });
  }
};

export const updateWorkspace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updatedFields = req.body;
    console.log(userId, id, req.body);

    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, userId },
      updatedFields,
      { new: true, validator: true }
    );

    if (!workspace)
      return res.status(404).json({ message: "workspace not founded" });

    return res.status(200).json(workspace);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update workspace", error: err.message });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const workspace = await Workspace.findOne({ _id: id, userId });
    if (!workspace)
      return res.status(404).json({ message: "Workspace not found" });

    const lists = await List.find({ workspaceId: id }, "_id");
    const listIds = lists.map((list) => list._id);

    await Promise.all([
      Workspace.findOneAndDelete({ _id: id, userId }),
      List.deleteMany({ workspaceId: id }),
      Task.deleteMany({ listId: { $in: listIds } }),
    ]);

    res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid workspace ID format" });
    }
    res.status(500).json({
      message: "Failed to delete workspace",
      error: err.message,
    });
  }
};

export const getWorkspacesCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const workspacesCount = await Workspace.countDocuments({ userId });

    res.status(201).json(workspacesCount);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get workspaces Count",
      error: err.message,
    });
  }
};
