import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export const GET = (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const q = req.nextUrl.searchParams.get("q") ?? "";
  return proxy((axios) => axios.get("/search", { params: workspaceId ? { q, workspaceId } : { q } }));
};
