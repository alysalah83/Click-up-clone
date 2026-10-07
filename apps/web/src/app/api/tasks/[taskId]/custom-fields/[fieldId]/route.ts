import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ taskId: string; fieldId: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { taskId, fieldId } = await params;
  const body = await req.json().catch(() => ({}));
  return proxy((axios) => axios.put(`/tasks/${taskId}/custom-fields/${fieldId}`, body));
}
