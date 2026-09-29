"use server";

import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { authServices } from "@/features/auth/services/auth.service";
import { setToken } from "@/shared/lib/cookies/setToken";
import { createServerAxios } from "@/shared/lib/axios/server";
import { formatActionError } from "@/shared/lib/utils/formatActionError";

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/);

/**
 * Joins the invite's workspace and opens its first list. Without a valid session it first
 * signs up a guest (the existing guest flow), so a visitor in an incognito window can act as
 * a second teammate in one click.
 */
export async function acceptInviteAction(inviteToken: string) {
  let destination = "/home/lists";
  try {
    const token = tokenSchema.parse(inviteToken);
    let session = (await cookies()).get("token")?.value;
    try {
      if (session) jwt.verify(session, process.env.JWT_SECRET!);
    } catch {
      session = undefined;
    }
    if (!session) {
      const guest = await authServices.signupGuest();
      await setToken(guest.token);
      session = guest.token;
    }

    const serverAxios = await createServerAxios();
    const accepted = await serverAxios.post<{ listId: string | null }>(`/invites/${token}/accept`, undefined, {
      headers: { Cookie: `token=${session}` },
    });
    if (accepted.listId) destination = `/home/lists/${accepted.listId}/board`;
  } catch (error) {
    return { status: "error" as const, error: formatActionError(error) };
  }
  redirect(destination, RedirectType.replace);
}
