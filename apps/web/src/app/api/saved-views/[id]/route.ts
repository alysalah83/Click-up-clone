import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxy((axios) => axios.patch(`/saved-views/${id}`, body));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy((axios) => axios.delete(`/saved-views/${id}`));
}
