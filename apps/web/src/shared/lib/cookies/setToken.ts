import { cookies } from "next/headers";

export const setToken = async (token: string) => {
  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // seconds (7 days)
    path: "/",
  });
};
