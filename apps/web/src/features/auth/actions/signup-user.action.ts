"use server";

import { redirect, RedirectType } from "next/navigation";
import { signupUserSchema } from "../schema/authSchemas";
import { authServices } from "../services/auth.service";
import { SignupUserInputs } from "../types";
import { setToken } from "@/shared/lib/cookies/setToken";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function signupUser(
  _prevState: any,
  signupUserInputs: SignupUserInputs,
) {
  try {
    const userInputs = signupUserSchema.parse(signupUserInputs);
    const { token } = await authServices.signupUser(userInputs);
    await setToken(token);
  } catch (error) {
    return { status: "error" as const, error: formatActionError(error) };
  }
  redirect("/home/lists", RedirectType.replace);
}
