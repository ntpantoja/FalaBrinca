import { NextResponse } from "next/server";
import { requireMember } from "../../../lib/access";
import { failure, HttpError } from "../../../lib/server";
export async function GET(request: Request) {
  try {
    const { db, role } = await requireMember(request);
    const { data, error } = await db
      .from("learning_activities")
      .select(
        "id,title,description,kind,emoji,color,minutes,category,difficulty,revision",
      )
      .eq("published", true)
      .order("sort_order")
      .order("created_at");
    if (error)
      throw new HttpError(
        503,
        "A biblioteca está sendo preparada pelo responsável. Tente novamente em breve.",
      );
    return NextResponse.json(
      { activities: data, role },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
