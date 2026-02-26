import { NextFunction, Request, Response } from "express";

export function catchAsync<
  params = {},
  resBody = {},
  reqBody = {},
  reqQuery = {},
>(
  handler: (
    req: Request<params, resBody, reqBody, reqQuery>,
    res: Response,
    next: NextFunction,
  ) => Promise<any>,
) {
  return (
    req: Request<params, resBody, reqBody, reqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    handler(req, res, next).catch(next);
  };
}
