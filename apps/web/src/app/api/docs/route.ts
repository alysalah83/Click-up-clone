import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  return proxy((axios) => axios.get("/docs", { params: workspaceId ? { workspaceId } : {} }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxy((axios) => axios.post("/docs", body));
}
