import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string; dependsOnId: string }> },
) {
  const { taskId, dependsOnId } = await params;
  return proxy((axios) => axios.delete(`/dependencies/${taskId}/${dependsOnId}`));
}
