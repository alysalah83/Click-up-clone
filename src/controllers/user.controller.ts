import { Request, Response } from "express";
import { generateToken } from "../lib/middlewares/auth.middleware.js";
import { prisma } from "../../prisma/prisma.js";
import bcrypt from "bcrypt";
import { COOKIES_OPTIONS } from "../consts/auth.const.js";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { AppError } from "../lib/errors/appError.js";

export const registerUser = catchAsync<
  {},
  {},
  { name: string; email: string; password: string }
>(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!email || !password || !password)
    throw new AppError("missing required values", 400);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });

  if (existingUser) throw new AppError("Email already exists", 409);

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "user",
    },
  });

  const token = generateToken(createdUser.id, "user");

  const { password: _, ...userWithoutPassword } = createdUser;

  res.cookie("token", token, COOKIES_OPTIONS);

  res.status(201).json({
    user: userWithoutPassword,
    token,
  });
});

export const registerGuest = catchAsync(
  async (_req: Request, res: Response) => {
    const createdGuest = await prisma.user.create({
      data: {
        role: "guest",
      },
      select: { id: true, role: true },
    });

    const token = generateToken(createdGuest.id, "guest");

    res.cookie("token", token, COOKIES_OPTIONS);

    res.cookie("token", token, COOKIES_OPTIONS);

    res.status(201).json({
      user: createdGuest,
      token,
    });
  },
);

export const loginUser = catchAsync(
  async (
    req: Request<{}, {}, { email: string; password: string }>,
    res: Response,
  ) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) throw new AppError("Email not existed", 404);
    if (!password) throw new AppError("password are required", 404);

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) throw new AppError("Invalid password", 406);

    const token = generateToken(user.id, "user");

    const { password: _, ...userWithoutPassword } = user;

    res.cookie("token", token, COOKIES_OPTIONS);

    return res.status(200).json({
      user: userWithoutPassword,
      token,
    });
  },
);

export const getUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  });

  return res.status(200).json(user);
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = await prisma.user.findUnique({
    where: { id },
    omit: { password: true },
  });
  return res.status(200).json(user);
});
