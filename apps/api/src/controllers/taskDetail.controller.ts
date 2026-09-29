import type { Request, Response } from "express";
import type {
  CreateChecklistInput,
  CreateChecklistItemInput,
  CreateSubtaskInput,
  CreateTagInput,
  UpdateChecklistInput,
  UpdateChecklistItemInput,
  UpdateDescriptionInput,
  UpdateTagInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/taskDetail.service.js";

type IdParams = { id: string };

export const getTaskDetail = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res.status(200).json(await service.getTaskDetail(req.userId, id));
});

export const updateDescription = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as IdParams;
    res
      .status(200)
      .json(
        await service.updateDescription(
          req.userId,
          id,
          req.body as UpdateDescriptionInput,
        ),
      );
  },
);

export const createSubtask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res
    .status(201)
    .json(
      await service.createSubtask(
        req.userId,
        id,
        req.body as CreateSubtaskInput,
      ),
    );
});

export const createChecklist = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as IdParams;
    res
      .status(201)
      .json(
        await service.createChecklist(
          req.userId,
          id,
          req.body as CreateChecklistInput,
        ),
      );
  },
);

export const updateChecklist = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as IdParams;
    res
      .status(200)
      .json(
        await service.updateChecklist(
          req.userId,
          id,
          req.body as UpdateChecklistInput,
        ),
      );
  },
);

export const deleteChecklist = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as IdParams;
    await service.deleteChecklist(req.userId, id);
    res.status(204).send();
  },
);

export const createChecklistItem = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as IdParams;
    res
      .status(201)
      .json(
        await service.createChecklistItem(
          req.userId,
          id,
          req.body as CreateChecklistItemInput,
        ),
      );
  },
);

export const updateChecklistItem = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as IdParams;
    res
      .status(200)
      .json(
        await service.updateChecklistItem(
          req.userId,
          id,
          req.body as UpdateChecklistItemInput,
        ),
      );
  },
);

export const deleteChecklistItem = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as IdParams;
    await service.deleteChecklistItem(req.userId, id);
    res.status(204).send();
  },
);

export const listTags = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params as { workspaceId: string };
  res.status(200).json(await service.listTags(req.userId, workspaceId));
});

export const createTag = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params as { workspaceId: string };
  res
    .status(201)
    .json(
      await service.createTag(
        req.userId,
        workspaceId,
        req.body as CreateTagInput,
      ),
    );
});

export const updateTag = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res
    .status(200)
    .json(await service.updateTag(req.userId, id, req.body as UpdateTagInput));
});

export const deleteTag = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  await service.deleteTag(req.userId, id);
  res.status(204).send();
});

export const addTagToTask = catchAsync(async (req: Request, res: Response) => {
  const { id, tagId } = req.params as { id: string; tagId: string };
  await service.addTagToTask(req.userId, id, tagId);
  res.status(204).send();
});

export const removeTagFromTask = catchAsync(
  async (req: Request, res: Response) => {
    const { id, tagId } = req.params as { id: string; tagId: string };
    await service.removeTagFromTask(req.userId, id, tagId);
    res.status(204).send();
  },
);
