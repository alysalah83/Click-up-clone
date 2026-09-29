import { after, connection } from "next/server";

// Wakes the serverless API and its database ahead of login/signup.
// /health lives at the API root (not under /api), so build it from API_URL's origin.
export async function GET() {
  // Opt out of build-time prerendering (cacheComponents) so the ping runs per request.
  await connection();
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
