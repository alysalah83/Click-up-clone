const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // express res.cookie maxAge is in milliseconds

export const COOKIES_OPTIONS =
  process.env.NODE_ENV === "development"
    ? ({ httpOnly: true, secure: false, sameSite: "lax", maxAge: SEVEN_DAYS_MS } as const)
    : ({ httpOnly: true, secure: true, sameSite: "none", maxAge: SEVEN_DAYS_MS } as const);
