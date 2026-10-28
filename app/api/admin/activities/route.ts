import { NextResponse } from "next/server";
import { requireMaster } from "../../../../lib/access";
import { failure, HttpError, requireOrigin } from "../../../../lib/server";
import { validateActivity } from "../../../../lib/content-validation";
export async function GET(request: Request) {
  try {
    const { db } = await requireMaster(request);
    const { data, error } = await db
      .from("learning_activities")
      .select("*")
      .order("sort_order")
      .order("created_at");
    if (error)
      throw new HttpError(
        503,
        "Execute a atualização do banco para ativar o editor.",
      );
    return NextResponse.json(
      { activities: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const { db, user } = await requireMaster(request);
    const body = await request.text();
    if (body.length > 60000)
      throw new HttpError(413, "A atividade é muito grande.");
    let input: unknown;
    try {
      input = JSON.parse(body);
    } catch {
      throw new HttpError(400, "Dados inválidos.");
    }
    const activity = validateActivity(input);
    if (!activity)
      throw new HttpError(
        400,
        "Confira os campos e as figuras de todas as rodadas.",
      );
    const { data, error } = await db
      .from("learning_activities")
      .insert({ ...activity, revision: 1, updated_by: user.id })
      .select()
      .single();
    if (error?.code === "23505")
      throw new HttpError(
        409,
        "Já existe uma atividade com esse identificador.",
      );
    if (error)
      throw new HttpError(
        503,
        "Não foi possível criar a atividade. Confira a atualização do banco.",
      );
    return NextResponse.json({ activity: data }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
