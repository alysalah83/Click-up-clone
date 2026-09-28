import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/appError.js";
import { handlePrismaError } from "../errors/prismaErrorHandler.js";
import { Prisma } from "../../generated/prisma/client.js";

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    errors?: any;
    stack?: string;
  };
}

export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction,
) {
  console.log(error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    error = handlePrismaError(error);
  }
  if (error instanceof AppError)
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
        errors: (error as any).errors,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
    });

  return res.status(500).json({
    success: false,
    error: {
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      statusCode: 500,
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    },
  });
}
