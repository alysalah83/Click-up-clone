import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxy((axios) => axios.get(`/chat/channels/${id}`));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  return proxy((axios) => axios.patch(`/chat/channels/${id}`, body));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxy((axios) => axios.delete(`/chat/channels/${id}`));
}
