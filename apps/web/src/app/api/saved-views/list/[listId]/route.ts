import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  return proxy((axios) => axios.get(`/saved-views/list/${listId}`));
}
