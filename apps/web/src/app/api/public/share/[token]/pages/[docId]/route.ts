import type { NextRequest } from "next/server";
import { publicGetProxy } from "@/shared/lib/publicApiProxy";

type Ctx = { params: Promise<{ token: string; docId: string }> };

/** Public: the shared doc or one of its sub-pages. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { token, docId } = await params;
  return publicGetProxy(req, `/public/share/${encodeURIComponent(token)}/pages/${encodeURIComponent(docId)}`);
}
