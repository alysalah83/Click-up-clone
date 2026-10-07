import type { Request, Response } from "express";
import type { ImportPayloadInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/import.service.js";

export const importList = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.importList(req.userId, req.body as ImportPayloadInput));
});
