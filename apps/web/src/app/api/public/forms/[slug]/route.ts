import type { NextRequest } from "next/server";
import { proxy } from "@/shared/lib/apiProxy";

type Ctx = { params: Promise<{ slug: string }> };

/** Public: works without the auth cookie. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  return proxy((axios) => axios.get(`/public/forms/${encodeURIComponent(slug)}`));
}
