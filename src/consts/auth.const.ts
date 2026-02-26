export const COOKIES_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 90 * 24 * 60 * 60 * 1000,
} as const;
