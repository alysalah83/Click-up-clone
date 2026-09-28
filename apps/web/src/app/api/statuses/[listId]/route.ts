import { Status } from "@/features/status/types";
import { createServerAxios } from "@/shared/lib/axios/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const axios = await createServerAxios();
  const data = await axios.get<Status[]>(`/statuses/list/${listId}`);
  return NextResponse.json(data);
}
