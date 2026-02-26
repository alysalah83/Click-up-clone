import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import type { StringValue } from "ms";
import { AppError } from "../errors/appError.js";

export type UserRole = "user" | "guest";

interface AuthPayload extends JwtPayload {
  id: string;
  role: UserRole;
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  if (!token) return next(new AppError("No token provided", 401));

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as AuthPayload;

    if (!decoded.id || !decoded.role)
      return next(new AppError("Invalid token payload", 401));

    if (decoded.role !== "user" && decoded.role !== "guest")
      return next(new AppError("Invalid user role", 401));

    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    return next(new AppError("invalid or expired token", 401));
  }
};

export const generateToken = (id: string, role: UserRole) => {
  const expiresIn: StringValue = (process.env.JWT_EXPIRES_IN ||
    "90d") as StringValue;
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn,
  });
};
