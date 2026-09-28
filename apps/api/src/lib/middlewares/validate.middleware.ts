import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";
import { ValidationError } from "../errors/index.js";

type RequestSchemas = { params?: ZodType; query?: ZodType; body?: ZodType };

export const validate =
  (schemas: RequestSchemas) => (req: Request, _res: Response, next: NextFunction) => {
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success)
        return next(new ValidationError(`Invalid request ${part}`, z.flattenError(result.error)));

      // Express 5 defines req.query as a getter, so redefine the property on this request.
      Object.defineProperty(req, part, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  };
