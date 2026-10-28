import { NextResponse } from "next/server";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { requireMaster } from "../../../../lib/access";
import { failure, HttpError, requireOrigin } from "../../../../lib/server";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const { db } = await requireMaster(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 2097152 || file.size === 0)
      throw new HttpError(
        400,
        "Escolha uma imagem PNG, JPG ou WebP de até 2 MB.",
      );
    let buffer: Buffer;
    try {
      const input = sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 16000000,
      });
      const metadata = await input.metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format ?? ""))
        throw new Error();
      buffer = await input
        .rotate()
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new HttpError(400, "A imagem não é válida. Use PNG, JPG ou WebP.");
    }
    const path = `illustrations/${randomUUID()}.webp`;
    const { error } = await db.storage
      .from("activity-media")
      .upload(path, buffer, { contentType: "image/webp", upsert: false });
    if (error)
      throw new HttpError(
        503,
        "Não foi possível enviar a imagem. Confira se o bucket activity-media foi criado.",
      );
    return NextResponse.json({
      url: db.storage.from("activity-media").getPublicUrl(path).data.publicUrl,
    });
  } catch (error) {
    return failure(error);
  }
}
