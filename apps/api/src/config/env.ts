import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
    CRON_SECRET: process.env.CRON_SECRET,
    /** Public web origin, used to build invite links. */
    WEB_URL: (process.env.WEB_URL ?? "https://click-up-clone-two.vercel.app").replace(/\/$/, ""),
    GUEST_SIGNUPS_PER_MINUTE: Number(process.env.GUEST_SIGNUPS_PER_MINUTE ?? 30),
    LOGIN_ATTEMPTS_PER_15_MIN: Number(process.env.LOGIN_ATTEMPTS_PER_15_MIN ?? 10),
  };
}

// Evaluated once at startup: a missing secret crashes the boot, not a request.
export const env = loadEnv();
