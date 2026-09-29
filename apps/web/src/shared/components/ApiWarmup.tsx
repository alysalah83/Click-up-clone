"use client";

import { useEffect } from "react";

const SESSION_KEY = "api-warmed-up";

/** Pings /api/warmup once per browser session to wake the API before the user signs in. */
function ApiWarmup() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable; just ping.
    }
    fetch("/api/warmup", { cache: "no-store", keepalive: true }).catch(
      () => {},
    );
  }, []);

  return null;
}

export default ApiWarmup;
