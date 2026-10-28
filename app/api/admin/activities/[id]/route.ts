import { NextResponse } from "next/server";
import { requireMaster } from "../../../../../lib/access";
import { failure, HttpError, requireOrigin } from "../../../../../lib/server";
import { validateActivity } from "../../../../../lib/content-validation";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireOrigin(request);
    const { db, user } = await requireMaster(request);
    const { id } = await params;
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
    if (!activity || activity.id !== id)
      throw new HttpError(
        400,
        "Confira a atividade e as rodadas antes de salvar.",
      );
    const { data, error } = await db
      .from("learning_activities")
      .update({
        ...activity,
        revision: activity.revision + 1,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", id)
      .eq("revision", activity.revision)
      .select()
      .maybeSingle();
    if (error)
      throw new HttpError(503, "Não foi possível atualizar a atividade.");
    if (!data)
      throw new HttpError(
        409,
        "Essa atividade foi alterada ou apagada em outra aba. Atualize a lista antes de editar.",
      );
    return NextResponse.json({ activity: data });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireOrigin(request);
    const { db } = await requireMaster(request);
    const { id } = await params;
    const revision = Number(new URL(request.url).searchParams.get("revision"));
    if (!Number.isInteger(revision) || revision < 1)
      throw new HttpError(400, "Atualize a lista antes de apagar.");
    const { data, error } = await db
      .from("learning_activities")
      .delete()
      .eq("id", id)
      .eq("revision", revision)
      .select("id")
      .maybeSingle();
    if (error) throw new HttpError(503, "Não foi possível apagar a atividade.");
    if (!data)
      throw new HttpError(
        409,
        "Essa atividade mudou em outra aba. Atualize a lista.",
      );
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return failure(error);
  }
}
