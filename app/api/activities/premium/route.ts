import { NextResponse } from "next/server";
import { requireMember } from "../../../../lib/access";
import { failure } from "../../../../lib/server";
export async function GET(request: Request) {
  try {
    await requireMember(request);
    return NextResponse.json(
      { redirect: "/atividades" },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
