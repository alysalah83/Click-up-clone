import type { NextRequest } from "next/server";
import { publicGetProxy } from "@/shared/lib/publicApiProxy";

type Ctx = { params: Promise<{ token: string }> };

/** Public: works without the auth cookie. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  return publicGetProxy(req, `/public/share/${encodeURIComponent(token)}`);
}
