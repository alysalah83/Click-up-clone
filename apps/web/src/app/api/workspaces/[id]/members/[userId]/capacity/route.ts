import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ id: string; userId: string }> };

/** Workload view: a member's capacity per day. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, userId } = await params;
  const body = await req.json().catch(() => ({}));
  return proxy((axios) => axios.patch(`/workspaces/${id}/members/${userId}/capacity`, body));
}
