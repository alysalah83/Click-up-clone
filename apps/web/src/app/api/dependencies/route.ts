import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

export const GET = (req: NextRequest) =>
  proxy((axios) => axios.get("/dependencies", { params: { listId: req.nextUrl.searchParams.get("listId") ?? "" } }));

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxy((axios) => axios.post("/dependencies", body));
}
