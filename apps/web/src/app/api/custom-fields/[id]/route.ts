import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxy((axios) => axios.patch(`/custom-fields/${id}`, body));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxy((axios) => axios.delete(`/custom-fields/${id}`));
}
