import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ listId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { listId } = await params;
  return proxy((axios) => axios.get(`/lists/${listId}/custom-fields`));
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { listId } = await params;
  const body = await req.json().catch(() => ({}));
  return proxy((axios) => axios.post(`/lists/${listId}/custom-fields`, body));
}
