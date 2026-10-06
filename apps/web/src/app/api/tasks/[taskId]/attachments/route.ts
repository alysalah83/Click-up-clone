import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ taskId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { taskId } = await params;
  return proxy((axios) => axios.get(`/tasks/${taskId}/attachments`));
}

/**
 * Forwards the raw file body (application/octet-stream) to the API as is, with the file
 * name/type headers, and relays the API's status and JSON (413 too large, 503 not configured...).
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { taskId } = await params;
  try {
    const body = await req.arrayBuffer();
    const res = await fetch(`${process.env.API_URL}/tasks/${taskId}/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        Cookie: (await cookies()).toString(),
        "x-file-name": req.headers.get("x-file-name") ?? "",
        "x-file-type": req.headers.get("x-file-type") ?? "",
      },
      body,
    });
    const json = await res.json().catch(() => ({ error: { message: "Upload failed" } }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: { message: "Upload failed" } }, { status: 502 });
  }
}
