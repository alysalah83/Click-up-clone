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
    /** Pre-seeded guest accounts kept ready so guest login is instant. Off in tests. */
    GUEST_POOL_SIZE: Number(
      process.env.GUEST_POOL_SIZE ?? (process.env.NODE_ENV === "test" ? 0 : 3),
    ),
    /** Vercel Blob store token (production/preview only); without it attachments uploads answer 503. */
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || undefined,
    LOGIN_ATTEMPTS_PER_15_MIN: Number(process.env.LOGIN_ATTEMPTS_PER_15_MIN ?? 10),
  };
}

// Evaluated once at startup: a missing secret crashes the boot, not a request.
export const env = loadEnv();
