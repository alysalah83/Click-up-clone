import { Task } from "../models/Task.js";
import { List } from "../models/List.js";
import mongoose from "mongoose";

export const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const createdFields = req.body;
    console.log(createdFields);

    if (!createdFields.listId || !createdFields.name) {
      return res.status(400).json({
        message: "listId and title are required fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(createdFields.listId)) {
      return res.status(400).json({
        message: "Invalid listId format",
      });
    }

    const list = await List.findOne({ _id: createdFields.listId, userId });
    if (!list) {
      return res.status(404).json({
        message: "List not found or access denied",
      });
    }

    const task = await Task.create({
      ...createdFields,
      userId,
    });

    res.status(201).json(task);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      message: "Failed to create task",
      error: err.message,
    });
  }
};

export const getTasksByListId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listId } = req.params;
    const {
      status,
      priority,
      createdAt,
      dueDate,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      search,
    } = req.query;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({
        message: "Invalid listId format",
      });
    }

    const list = await List.findOne({ _id: listId, userId });
    if (!list) {
      return res.status(404).json({
        message: "List not found or access denied",
      });
    }

    const matchQuery = { listId: list._id };

    // Add search functionality
    if (search) {
      matchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const addFields = {};
    const sortObject = {};

    // Helper function to get sort direction
    const getSortDirection = (value) => {
      return value && value.toLowerCase() === "desc" ? -1 : 1;
    };

    // Handle status sorting with custom order
    if (status) {
      const direction = getSortDirection(status);
      addFields.statusOrder = {
        $switch: {
          branches: [
            { case: { $eq: ["$status", "toDo"] }, then: 1 },
            { case: { $eq: ["$status", "inProgress"] }, then: 2 },
            { case: { $eq: ["$status", "complete"] }, then: 3 },
          ],
          default: 4,
        },
      };
      sortObject.statusOrder = direction;
    }

    // Handle priority sorting with custom order
    if (priority) {
      const direction = getSortDirection(priority);
      addFields.priorityOrder = {
        $switch: {
          branches: [
            { case: { $eq: ["$priority", "urgent"] }, then: 1 },
            { case: { $eq: ["$priority", "high"] }, then: 2 },
            { case: { $eq: ["$priority", "normal"] }, then: 3 },
            { case: { $eq: ["$priority", "low"] }, then: 4 },
          ],
          default: 5,
        },
      };
      sortObject.priorityOrder = direction;
    }

    // Helper function for date sorting with null handling
    const addDateSort = (fieldName, queryParam) => {
      if (queryParam) {
        const direction = getSortDirection(queryParam);
        const sortFieldName = `${fieldName}Sort`;
        addFields[sortFieldName] = {
          $cond: {
            if: {
              $or: [
                { $eq: [`$${fieldName}`, null] },
                { $eq: [`$${fieldName}`, undefined] },
              ],
            },
            then:
              direction === 1 ? new Date("2099-12-31") : new Date("1900-01-01"),
            else: `$${fieldName}`,
          },
        };
        sortObject[sortFieldName] = direction;
      }
    };

    // Handle date field sorting
    if (createdAt) {
      sortObject.createdAt = getSortDirection(createdAt);
    }
    addDateSort("dueDate", dueDate);
    addDateSort("startDate", startDate);
    addDateSort("endDate", endDate);

    // Helper function to transform aggregation results
    const transformTask = (task) => {
      const transformed = { ...task };
      if (transformed._id) {
        transformed.id = transformed._id;
        delete transformed._id;
      }
      delete transformed.__v;
      delete transformed.password;
      return transformed;
    };

    let tasks;
    let totalCount = 0;

    // Check if any sorting is requested
    if (Object.keys(sortObject).length > 0) {
      // Build aggregation pipeline for complex sorting
      const pipeline = [{ $match: matchQuery }];

      // Add computed fields if needed
      if (Object.keys(addFields).length > 0) {
        pipeline.push({ $addFields: addFields });
      }

      // Add sort stage
      pipeline.push({ $sort: sortObject });

      // Add pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      if (skip > 0) pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });

      // Remove temporary computed fields
      if (Object.keys(addFields).length > 0) {
        const projectStage = { $project: {} };
        Object.keys(addFields).forEach((field) => {
          projectStage.$project[field] = 0;
        });
        pipeline.push(projectStage);
      }

      // Get total count for pagination
      const countPipeline = [{ $match: matchQuery }, { $count: "total" }];
      const countResult = await Task.aggregate(countPipeline);
      totalCount = countResult[0]?.total || 0;

      const aggregationResults = await Task.aggregate(pipeline);
      tasks = aggregationResults.map(transformTask);
    } else {
      // No sorting requested - use default sort by createdAt desc
      const skip = (parseInt(page) - 1) * parseInt(limit);

      totalCount = await Task.countDocuments(matchQuery);
      tasks = await Task.find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    res.status(200).json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: err.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID format",
      });
    }

    const { userId: _, listId: __, ...sanitizedUpdateData } = updateData;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      sanitizedUpdateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found or access denied",
      });
    }

    res.status(200).json(task);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      message: "Failed to update task",
      error: err.message,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({
        message: "Invalid task ID format",
      });

    const task = await Task.findOneAndDelete({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or access denied",
      });
    }

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete task",
      error: err.message,
    });
  }
};

export const deleteManyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listId } = req.params;
    const taskIds = req.body;

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({
        message: "Invalid list ID format",
      });
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        message: "Task IDs must be a non-empty array",
      });
    }

    const invalidIds = taskIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0)
      return res.status(400).json({
        message: "Invalid task ID format(s) found",
        invalidIds,
      });

    const result = await Task.deleteMany({
      _id: { $in: taskIds },
      userId,
      listId,
    });

    res.status(200).json({
      message: `${result.deletedCount} tasks deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete tasks",
      error: err.message,
    });
  }
};

export const updateManyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tasksId, updatedFields } = req.body;

    if (!Array.isArray(tasksId) || tasksId.length === 0) {
      return res.status(400).json({
        message: "tasksId must be a non-empty array",
      });
    }

    if (!updatedFields || Object.keys(updatedFields).length === 0) {
      return res.status(400).json({
        message: "updatedFields cannot be empty",
      });
    }

    const invalidIds = tasksId.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Invalid task ID format(s) found",
        invalidIds,
      });
    }

    const {
      userId: updatedUserId,
      listId: updatedListId,
      ...sanitizedFields
    } = updatedFields;

    const result = await Task.updateMany(
      {
        userId,
        _id: { $in: tasksId },
      },
      sanitizedFields,
      { runValidators: true }
    );

    res.status(200).json(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      message: "Failed to update tasks",
      error: err.message,
    });
  }
};

export const getListTasksCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listId } = req.params;

    const tasks = await Task.find({ userId, listId }, "status");
    if (!tasks)
      return res.status(400).json({
        message: "Tasks not found",
      });

    const totalCount = tasks.length;
    const statusCount = tasks.reduce((counts, task) => {
      counts[`${task.status}Count`] = (counts[`${task.status}Count`] || 0) + 1;
      return counts;
    }, {});

    return res.status(200).json({
      totalCount,
      toDoCount: statusCount.toDoCount || 0,
      inProgressCount: statusCount.inProgressCount || 0,
      completeCount: statusCount.completeCount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "something went wrong" });
  }
};

export const getTasksCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({ userId }, "status");
    if (!tasks)
      return res.status(400).json({
        message: "Tasks not found",
      });

    const totalCount = tasks.length;
    const statusCount = tasks.reduce((counts, task) => {
      counts[`${task.status}Count`] = (counts[`${task.status}Count`] || 0) + 1;
      return counts;
    }, {});

    return res.status(200).json({
      totalCount,
      toDoCount: statusCount.toDoCount || 0,
      inProgressCount: statusCount.inProgressCount || 0,
      completeCount: statusCount.completeCount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "something went wrong" });
  }
};

export const getTasksPriority = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find(
      { userId, priority: { $ne: "none" } },
      "priority"
    );

    if (!tasks)
      return res.status(404).json({ message: "something went wrong" });

    const priorityCount = tasks.reduce((count, task) => {
      count[task.priority] = (count[task.priority] || 0) + 1;
      return count;
    }, {});

    const result = {
      urgent: priorityCount.urgent || 0,
      high: priorityCount.high || 0,
      normal: priorityCount.normal || 0,
      low: priorityCount.low || 0,
      none: priorityCount.none || 0,
    };

    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || "something went wrong" });
  }
};
