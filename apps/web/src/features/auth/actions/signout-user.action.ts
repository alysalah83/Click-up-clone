"use server";

import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";

export async function signOutUser() {
  (await cookies()).delete("token");

  redirect("/login", RedirectType.replace);
}
