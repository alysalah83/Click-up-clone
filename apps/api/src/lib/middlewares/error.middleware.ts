import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/appError.js";
import { handlePrismaError } from "../errors/prismaErrorHandler.js";
import { Prisma } from "../../generated/prisma/client.js";

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    errors?: unknown;
    stack?: string;
  };
}

const isPrismaError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError ||
  error instanceof Prisma.PrismaClientValidationError ||
  error instanceof Prisma.PrismaClientInitializationError ||
  error instanceof Prisma.PrismaClientUnknownRequestError;

const isMalformedJson = (error: unknown) =>
  error instanceof SyntaxError && "status" in error && error.status === 400;

export function globalErrorHandler(
  error: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
) {
  const isDev = process.env.NODE_ENV === "development";

  if (isMalformedJson(error))
    return res.status(400).json({
      success: false,
      error: { message: "Malformed JSON body", statusCode: 400 },
    });

  const appError =
    error instanceof AppError ? error : isPrismaError(error) ? handlePrismaError(error) : null;

  if (appError) {
    if (appError.statusCode >= 500) console.error(error);
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        message: appError.message,
        statusCode: appError.statusCode,
        errors: (appError as AppError & { errors?: unknown }).errors,
        ...(isDev && { stack: appError.stack }),
      },
    });
  }

  console.error(error);
  const err = error as Error;
  return res.status(500).json({
    success: false,
    error: {
      message: isDev ? err.message : "Internal server error",
      statusCode: 500,
      ...(isDev && { stack: err.stack }),
    },
  });
}
