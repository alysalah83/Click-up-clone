import { List } from "../models/List.js";
import { Workspace } from "../models/Workspace.js";
import { Task } from "../models/Task.js";

export const createList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, workspaceId } = req.body;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      userId,
    });

    if (!workspace)
      return res.status(404).json({ message: "Workspace not found" });

    const list = await List.create({ name, workspaceId, userId });
    res.status(201).json(list);
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid workspace ID format" });

    res.status(500).json({
      message: "Failed to create list",
      error: err.message,
    });
  }
};

export const getLists = async (req, res) => {
  try {
    const userId = req.user.id;

    const lists = await List.find({ userId });
    // if (!lists) return res.status(404).json({ message: "cant find lists" });

    return res.status(201).json(lists);
  } catch (error) {
    if (error.name === "CastError")
      return res.status(400).json({ message: "Invalid workspace ID format" });

    res.status(500).json({
      message: "Failed to fetch lists",
      error: error.message,
    });
  }
};

export const getListsByWorkspaceId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId } = req.params;

    if (!workspaceId)
      return res
        .status(400)
        .json({ message: "workspaceId query parameter is required" });

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      userId,
    });

    if (!workspace)
      return res.status(404).json({ message: "Workspace not found" });

    const lists = await List.find({ workspaceId });
    res.status(200).json(lists);
  } catch (err) {
    if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid workspace ID format" });

    res.status(500).json({
      message: "Failed to fetch lists",
      error: err.message,
    });
  }
};

export const updateList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updatedFields = req.body;

    const list = await List.findOneAndUpdate(
      { _id: id, userId },
      updatedFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!list) return res.status(404).json({ message: "list not found" });
    return res.status(200).json(list);
  } catch (err) {
    if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid workspace ID format" });

    res.status(500).json({
      message: "Failed to fetch lists",
      error: err.message,
    });
  }
};

export const deleteList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const list = await List.findById(id);
    if (!list) return res.status(404).json({ message: "List not found" });

    const workspace = await Workspace.findOne({
      _id: list.workspaceId,
      userId,
    });

    if (!workspace)
      return res.status(403).json({ message: "Access denied to this list" });

    await Promise.all([
      List.findByIdAndDelete(id),
      Task.deleteMany({ listId: id }),
    ]);

    res.status(200).json({ message: "List deleted successfully" });
  } catch (err) {
    if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid list ID format" });

    res.status(500).json({
      message: "Failed to delete list",
      error: err.message,
    });
  }
};

export const getLatestListId = async (req, res) => {
  try {
    const userId = req.user.id;

    const latestList = await List.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("_id");

    if (!latestList) return res.status(200).json(null);

    res.status(200).json(latestList._id);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({
      message: "Failed to fetch latest list ID",
      error: error.message,
    });
  }
};
