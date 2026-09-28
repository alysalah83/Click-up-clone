"use server";

import { setToken } from "@/shared/lib/cookies/setToken";
import { loginSchema } from "../schema/authSchemas";
import { authServices } from "../services/auth.service";
import { LoginInputs } from "../types";
import { redirect, RedirectType } from "next/navigation";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function loginUser(_prevState: any, loginInputs: LoginInputs) {
  try {
    const userInputs = loginSchema.parse(loginInputs);
    const { token } = await authServices.loginUser(userInputs);
    await setToken(token);
  } catch (error) {
    return { status: "error" as const, error: formatActionError(error) };
  }
  redirect("/home/lists", RedirectType.replace);
}
