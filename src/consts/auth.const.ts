export const COOKIES_OPTIONS =
  process.env.NODE_ENV === "development"
    ? ({
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000,
      } as const)
    : ({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 90 * 24 * 60 * 60 * 1000,
      } as const);
