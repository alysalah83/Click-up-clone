import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceTags } from "@/features/taskDetail/api/taskDetail.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  return NextResponse.json(await getWorkspaceTags(workspaceId));
}
