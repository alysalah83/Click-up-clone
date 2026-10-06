import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  return proxy((axios) => axios.get("/task-templates", { params: workspaceId ? { workspaceId } : {} }));
}
