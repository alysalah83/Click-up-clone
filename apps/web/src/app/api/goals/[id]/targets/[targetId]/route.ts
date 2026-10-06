import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ id: string; targetId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, targetId } = await params;
  const body = await req.json();
  return proxy((axios) => axios.patch(`/goals/${id}/targets/${targetId}`, body));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, targetId } = await params;
  return proxy((axios) => axios.delete(`/goals/${id}/targets/${targetId}`));
}
