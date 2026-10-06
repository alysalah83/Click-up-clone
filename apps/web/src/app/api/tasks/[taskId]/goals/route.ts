import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ taskId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { taskId } = await params;
  return proxy((axios) => axios.get(`/tasks/${taskId}/goals`));
}
