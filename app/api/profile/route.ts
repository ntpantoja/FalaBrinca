import { NextResponse } from "next/server";
import {
  failure,
  HttpError,
  requireOrigin,
  requireUser,
} from "../../../lib/server";
import { parseProfile } from "../../../lib/profile";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  try {
    const { user, db } = await requireUser(request);
    const { data, error } = await db
      .from("family_profiles")
      .select("guardian_name,child_first_name,consent_version")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error)
      throw new HttpError(
        503,
        "O perfil da família ainda não está disponível. A configuração do banco precisa ser atualizada.",
      );
    return NextResponse.json({ profile: data }, { headers });
  } catch (error) {
    return failure(error);
  }
}
export async function PUT(request: Request) {
  try {
    requireOrigin(request);
    const { user, db } = await requireUser(request);
    const text = await request.text();
    if (text.length > 2000)
      throw new HttpError(413, "Os dados enviados são muito longos.");
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      throw new HttpError(400, "Confira os dados do perfil.");
    }
    const profile = parseProfile(input);
    if (!profile)
      throw new HttpError(
        400,
        "Preencha seu nome, o primeiro nome da criança e a autorização do responsável.",
      );
    const { error } = await db.from("family_profiles").upsert(
      {
        ...profile,
        user_id: user.id,
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error)
      throw new HttpError(
        503,
        "Não foi possível salvar o perfil. Confira a configuração do banco e tente novamente.",
      );
    return NextResponse.json({ profile }, { headers });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    requireOrigin(request);
    const { user, db } = await requireUser(request);
    const { error } = await db
      .from("family_profiles")
      .delete()
      .eq("user_id", user.id);
    if (error)
      throw new HttpError(
        503,
        "Não foi possível apagar os nomes. Tente novamente.",
      );
    return NextResponse.json({ deleted: true }, { headers });
  } catch (error) {
    return failure(error);
  }
}
