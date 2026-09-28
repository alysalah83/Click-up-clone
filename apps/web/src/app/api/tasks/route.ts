import { createServerAxios } from "@/shared/lib/axios/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const axios = await createServerAxios();
  const search = req.nextUrl.search;
  const data = await axios.get(`/tasks${search}`);
  return NextResponse.json(data);
}
