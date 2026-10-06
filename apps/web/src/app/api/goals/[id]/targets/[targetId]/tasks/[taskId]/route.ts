import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ id: string; targetId: string; taskId: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, targetId, taskId } = await params;
  return proxy((axios) => axios.delete(`/goals/${id}/targets/${targetId}/tasks/${taskId}`));
}
