import { after } from "next/server";

// Wakes the serverless API and its database ahead of login/signup.
// /health lives at the API root (not under /api), so build it from API_URL's origin.
export function GET() {
  after(async () => {
    try {
      await fetch(new URL("/health", process.env.API_URL), {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      // Best effort; the real request will surface any error.
    }
  });
  return new Response(null, { status: 204 });
}
