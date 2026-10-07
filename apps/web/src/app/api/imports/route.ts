import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

/** Import wizard: creates a list from a parsed CSV file or Trello board. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxy((axios) => axios.post("/imports", body));
}
