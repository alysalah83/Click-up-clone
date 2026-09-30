import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy((axios) => axios.delete(`/time-entries/${id}`));
}
