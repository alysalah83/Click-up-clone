import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ resourceType: string; resourceId: string }> };

const path = ({ resourceType, resourceId }: { resourceType: string; resourceId: string }) =>
  `/share-links/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`;

export async function GET(_req: NextRequest, { params }: Ctx) {
  const p = await params;
  return proxy((axios) => axios.get(path(p)));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const p = await params;
  const body = await req.json();
  return proxy((axios) => axios.put(path(p), body));
}
