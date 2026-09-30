import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export const GET = (req: NextRequest) =>
  proxy((axios) => axios.get("/time-entries", { params: { taskId: req.nextUrl.searchParams.get("taskId") ?? "" } }));
