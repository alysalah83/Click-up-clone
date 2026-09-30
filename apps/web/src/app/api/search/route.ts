import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export const GET = (req: NextRequest) =>
  proxy((axios) => axios.get("/search", { params: { q: req.nextUrl.searchParams.get("q") ?? "" } }));
