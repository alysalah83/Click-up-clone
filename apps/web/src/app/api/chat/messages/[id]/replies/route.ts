import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy((axios) => axios.get(`/chat/messages/${id}/replies`));
}
