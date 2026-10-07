import express from "express";
import {
  chatChannelsQuerySchema,
  chatMessagesQuerySchema,
  chatTaskSchema,
  createChatChannelSchema,
  createChatMessageSchema,
  idParamsSchema,
  toggleReactionSchema,
  updateChatChannelSchema,
  updateChatMessageSchema,
} from "@clickup/shared";
import * as c from "../controllers/chat.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const params = idParamsSchema;

/** /api/chat/channels */
export const chatChannelsRouter = express.Router();
chatChannelsRouter.use(authMiddleware);
chatChannelsRouter.get("/", validate({ query: chatChannelsQuerySchema }), c.listChannels);
chatChannelsRouter.post("/", validate({ body: createChatChannelSchema }), c.createChannel);
chatChannelsRouter.get("/:id", validate({ params }), c.getChannel);
chatChannelsRouter.patch("/:id", validate({ params, body: updateChatChannelSchema }), c.updateChannel);
chatChannelsRouter.delete("/:id", validate({ params }), c.deleteChannel);
chatChannelsRouter.post("/:id/read", validate({ params }), c.markRead);
chatChannelsRouter.get("/:id/messages", validate({ params, query: chatMessagesQuerySchema }), c.listMessages);
chatChannelsRouter.post("/:id/messages", validate({ params, body: createChatMessageSchema }), c.postMessage);

/** /api/chat/messages */
export const chatMessagesRouter = express.Router();
chatMessagesRouter.use(authMiddleware);
chatMessagesRouter.patch("/:id", validate({ params, body: updateChatMessageSchema }), c.editMessage);
chatMessagesRouter.delete("/:id", validate({ params }), c.deleteMessage);
chatMessagesRouter.get("/:id/replies", validate({ params }), c.listReplies);
chatMessagesRouter.post("/:id/reactions", validate({ params, body: toggleReactionSchema }), c.toggleReaction);
chatMessagesRouter.post("/:id/task", validate({ params, body: chatTaskSchema }), c.createTask);
