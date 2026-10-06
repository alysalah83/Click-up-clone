import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ id: string; targetId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id, targetId } = await params;
  const body = await req.json();
  return proxy((axios) => axios.post(`/goals/${id}/targets/${targetId}/tasks`, body));
}
