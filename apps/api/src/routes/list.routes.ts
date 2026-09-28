import express from "express";
import {
  countQuerySchema,
  createListSchema,
  idParamsSchema,
  listIdParamsSchema,
  listInWorkspaceParamsSchema,
  updateListSchema,
  workspaceIdParamsSchema,
} from "@clickup/shared";
import {
  checkListOwnership,
  createList,
  deleteList,
  getLatestList,
  getList,
  getLists,
  getListsByWorkspace,
  updateList,
} from "../controllers/list.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", validate({ query: countQuerySchema }), getLists);
router.get("/latest", getLatestList);
router.get("/workspace/:workspaceId", validate({ params: workspaceIdParamsSchema }), getListsByWorkspace);
router.get("/:listId", validate({ params: listIdParamsSchema }), getList);
router.get(
  "/:listId/belong-to/:workspaceId",
  validate({ params: listInWorkspaceParamsSchema }),
  checkListOwnership,
);
router.post("/", validate({ body: createListSchema }), createList);
router.patch("/:id", validate({ params: idParamsSchema, body: updateListSchema }), updateList);
router.delete("/:id", validate({ params: idParamsSchema }), deleteList);

export default router;
