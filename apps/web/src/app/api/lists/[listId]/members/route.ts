import { NextRequest, NextResponse } from "next/server";
import { getListMembers } from "@/features/members/api/members.server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  return NextResponse.json(await getListMembers(listId));
}
