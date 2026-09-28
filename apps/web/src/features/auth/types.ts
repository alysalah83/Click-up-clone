import z from "zod";
import { loginSchema, signupUserSchema } from "./schema/authSchemas";

type UserWithoutPassword = Omit<User, "password">;

interface User {
  role: "guest" | "user";
  hasOnBoarded: boolean;
  name: string | null;
  id: string;
  email: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  user: UserWithoutPassword;
  token: string;
}

type LoginInputs = z.infer<typeof loginSchema>;
type SignupUserInputs = z.infer<typeof signupUserSchema>;

export type {
  UserWithoutPassword,
  User,
  Session,
  LoginInputs,
  SignupUserInputs,
};
