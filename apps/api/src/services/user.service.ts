import bcrypt from "bcrypt";
import type { LoginInput, RegisterInput, UpdateMeInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../lib/errors/index.js";

const publicUser = {
  id: true,
  role: true,
  name: true,
  email: true,
  hasOnBoarded: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function registerUser({ name, email, password }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ConflictError("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { name, email, password: hashedPassword, role: "user" },
    select: publicUser,
  });
}

export function registerGuest() {
  return prisma.user.create({ data: { role: "guest" }, select: publicUser });
}

export async function verifyCredentials({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = user?.password ? await bcrypt.compare(password, user.password) : false;
  // One message for both cases, so the endpoint does not reveal which emails exist.
  if (!user || !isValid) throw new UnauthorizedError("Invalid email or password");

  const { password: _password, ...rest } = user;
  return rest;
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export function updateMe(userId: string, { hasOnBoarded }: UpdateMeInput) {
  return prisma.user.update({ where: { id: userId }, data: { hasOnBoarded }, select: publicUser });
}
