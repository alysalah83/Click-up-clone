import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export const GET = (req: NextRequest) =>
  proxy((axios) => axios.get("/dashboard/burndown", { params: { listId: req.nextUrl.searchParams.get("listId") ?? "" } }));
