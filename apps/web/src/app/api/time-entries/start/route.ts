import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxy((axios) => axios.post("/time-entries/start", body));
}
