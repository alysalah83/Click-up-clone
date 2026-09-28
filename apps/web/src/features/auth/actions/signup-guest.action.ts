"use server";

import { redirect, RedirectType } from "next/navigation";
import { authServices } from "../services/auth.service";
import { setToken } from "@/shared/lib/cookies/setToken";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function signupGuest() {
  try {
    const cookieToken = (await cookies()).get("token")?.value;
    if (cookieToken) jwt.verify(cookieToken, process.env.JWT_SECRET!);
    else {
      const { token } = await authServices.signupGuest();
      await setToken(token);
    }
  } catch (error) {
    return { status: "error" as const, error: formatActionError(error) };
  }
  redirect("/home/lists", RedirectType.replace);
}
