import { NextResponse } from "next/server";
import { getPeople } from "@/features/members/api/members.server";

export async function GET() {
  return NextResponse.json(await getPeople());
}
