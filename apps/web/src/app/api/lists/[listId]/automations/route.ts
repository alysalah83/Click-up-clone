import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  return proxy((axios) => axios.get(`/lists/${listId}/automations`));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const body = await req.json();
  return proxy((axios) => axios.post(`/lists/${listId}/automations`, body));
}
