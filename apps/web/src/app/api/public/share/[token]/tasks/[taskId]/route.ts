import type { NextRequest } from "next/server";
import { publicGetProxy } from "@/shared/lib/publicApiProxy";

type Ctx = { params: Promise<{ token: string; taskId: string }> };

/** Public: one task of a shared list, with its description. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { token, taskId } = await params;
  return publicGetProxy(req, `/public/share/${encodeURIComponent(token)}/tasks/${encodeURIComponent(taskId)}`);
}
