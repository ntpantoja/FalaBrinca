import { NextResponse } from "next/server";
import { requireMember } from "../../../../lib/access";
import { failure, HttpError } from "../../../../lib/server";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { db } = await requireMember(request);
    const { id } = await params;
    const { data, error } = await db
      .from("learning_activities")
      .select("content")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();
    if (error)
      throw new HttpError(503, "Não foi possível carregar a atividade.");
    if (!data) throw new HttpError(404, "Essa atividade não está disponível.");
    return NextResponse.json(data.content, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
