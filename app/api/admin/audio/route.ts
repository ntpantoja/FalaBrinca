import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireMaster } from "../../../../lib/access";
import { failure, HttpError, requireOrigin } from "../../../../lib/server";
import {
  recordedAudioType,
  MAX_AUDIO_BYTES,
} from "../../../../lib/recorded-audio";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const { db } = await requireMaster(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_AUDIO_BYTES)
      throw new HttpError(400, "Grave um áudio de até 20 segundos e 3 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = recordedAudioType(buffer, file.type);
    if (!type)
      throw new HttpError(
        400,
        "Áudio inválido. Grave novamente usando este navegador.",
      );
    const path = `words/${randomUUID()}.${type.extension}`;
    const { error } = await db.storage
      .from("activity-audio")
      .upload(path, buffer, {
        contentType: type.mime,
        upsert: false,
      });
    if (error)
      throw new HttpError(
        503,
        "Não foi possível salvar o áudio. Confira se o bucket activity-audio foi criado no Supabase.",
      );
    return NextResponse.json({
      url: db.storage.from("activity-audio").getPublicUrl(path).data.publicUrl,
    });
  } catch (error) {
    return failure(error);
  }
}
