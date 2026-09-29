import { NextRequest, NextResponse } from "next/server";
import { getTaskDetail } from "@/features/taskDetail/api/taskDetail.server";
import { ApiError } from "@/shared/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  try {
    return NextResponse.json(await getTaskDetail(taskId));
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode || 500 : 500;
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: { message } }, { status });
  }
}
