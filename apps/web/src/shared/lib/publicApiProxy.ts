import { NextResponse, type NextRequest } from "next/server";
import axios from "axios";

/** The visitor's IP, sent to the API as X-Client-Ip (every request reaches it from this server). */
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

/**
 * GET on a public (no login) API endpoint: no cookies are forwarded, the visitor's IP goes along
 * for the API's per-visitor rate limits, and the API status is passed through.
 */
export async function publicGetProxy(req: NextRequest, path: string) {
  try {
    const res = await axios.get(`${process.env.API_URL}${path}`, {
      headers: { "X-Client-Ip": clientIp(req.headers) },
      validateStatus: () => true,
    });
    return NextResponse.json(res.data ?? {}, { status: res.status });
  } catch {
    return NextResponse.json({ error: { message: "Network error. Check your connection." } }, { status: 502 });
  }
}
