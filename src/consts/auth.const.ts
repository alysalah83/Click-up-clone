export const COOKIES_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 90 * 24 * 60 * 60 * 1000,
} as const;

console.log(process.env.NODE_ENV);
