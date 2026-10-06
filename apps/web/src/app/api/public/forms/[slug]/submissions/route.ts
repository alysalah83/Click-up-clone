import { NextResponse, type NextRequest } from "next/server";
import axios from "axios";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Public form submission: no cookies are forwarded. The visitor's IP goes along as X-Client-Ip,
 * since every request reaches the API from this server (the API rate-limits per visitor).
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  try {
    const res = await axios.post(`${process.env.API_URL}/public/forms/${encodeURIComponent(slug)}/submissions`, body, {
      headers: { "Content-Type": "application/json", "X-Client-Ip": clientIp },
      validateStatus: () => true,
    });
    return NextResponse.json(res.data ?? { ok: true }, { status: res.status });
  } catch {
    return NextResponse.json({ error: { message: "Network error. Check your connection." } }, { status: 502 });
  }
}
