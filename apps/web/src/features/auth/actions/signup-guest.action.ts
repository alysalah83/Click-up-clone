"use server";

import { redirect, RedirectType } from "next/navigation";
import { authServices } from "../services/auth.service";
import { setToken } from "@/shared/lib/cookies/setToken";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

export async function signupGuest() {
  let landing = "/home/lists";
  try {
    const cookieToken = (await cookies()).get("token")?.value;
    if (cookieToken) jwt.verify(cookieToken, process.env.JWT_SECRET!);
    else {
      const { token, landingListId } = await authServices.signupGuest();
      await setToken(token);
      // New guests get a seeded demo workspace: open its Sprint Board directly.
      if (landingListId) landing = `/home/lists/${landingListId}/board`;
    }
  } catch (error) {
    return { status: "error" as const, error: formatActionError(error) };
  }
  redirect(landing, RedirectType.replace);
}
