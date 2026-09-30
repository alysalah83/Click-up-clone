import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export const GET = (req: NextRequest) =>
  proxy((axios) => axios.get("/my-work", { params: { tz: req.nextUrl.searchParams.get("tz") ?? undefined } }));
