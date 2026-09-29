import { getWithHeaders } from "@/shared/lib/axios/server";
import { fetchAllPages } from "@/features/task/lib/fetchAllPages";
import { NextRequest, NextResponse } from "next/server";

const TASKS_PAGE_LIMIT = 1000;

export async function GET(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  params.set("limit", String(TASKS_PAGE_LIMIT));
  params.delete("cursor");

  const tasks = await fetchAllPages(async (cursor) => {
    if (cursor) params.set("cursor", cursor);
    else params.delete("cursor");

    const { data, nextCursor } = await getWithHeaders(`/tasks?${params.toString()}`);
    return { items: data as unknown[], nextCursor };
  });

  return NextResponse.json(tasks);
}
