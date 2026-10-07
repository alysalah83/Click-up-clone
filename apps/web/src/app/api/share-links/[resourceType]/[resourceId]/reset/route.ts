import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ resourceType: string; resourceId: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { resourceType, resourceId } = await params;
  return proxy((axios) =>
    axios.post(`/share-links/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/reset`),
  );
}
