import { cookies } from "next/headers";

export const setToken = async (token: string) => {
  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 90 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};
