import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "./appError.js";
import { NotFoundError, ConflictError, ValidationError } from "./index.js";

export function handlePrismaError(error: any): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError)
    switch (error.code) {
      case "P2002": {
        const field = error.meta?.target as string[] | undefined;
        return new ConflictError(
          `A record with this ${field?.join(", ") || "field"} already exists`,
        );
      }

      case "P2025":
        return new NotFoundError("Record not found");

      case "P2003":
        return new ValidationError("Referenced record does not exist");

      case "P2014":
        return new ValidationError("Invalid ID provided");

      case "P2021":
        return new AppError("Database configuration error", 500, false);

      case "P2023":
        return new ValidationError("Invalid data format");

      default:
        return new AppError("Database operation failed", 500);
    }

  if (error instanceof Prisma.PrismaClientValidationError)
    return new ValidationError("Invalid data provided");

  if (error instanceof Prisma.PrismaClientInitializationError)
    return new AppError("Database connection failed", 503, false);

  return new AppError("An unexpected database error occurred", 500);
}
