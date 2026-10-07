import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ id: string }> };
const CURSOR_PARAMS = ["after", "before", "since", "limit"];

/** Polling (`?after=&since=`) and history (`?before=`) pass their cursors through. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const query = Object.fromEntries(
    CURSOR_PARAMS.flatMap((key) => {
      const value = req.nextUrl.searchParams.get(key);
      return value ? [[key, value]] : [];
    }),
  );
  return proxy((axios) => axios.get(`/chat/channels/${id}/messages`, { params: query }));
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  return proxy((axios) => axios.post(`/chat/channels/${id}/messages`, body));
}
