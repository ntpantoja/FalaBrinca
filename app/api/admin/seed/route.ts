import { NextResponse } from "next/server";
import { requireMaster } from "../../../../lib/access";
import { failure, HttpError, requireOrigin } from "../../../../lib/server";
import { catalog } from "../../../../lib/catalog";
import { allContent } from "../../../../lib/activity-content";
import { sequencePictures } from "../../../../lib/pictures";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const { db, user } = await requireMaster(request);
    const rows = catalog.map((a, index) => ({
      ...a,
      published: true,
      revision: 1,
      sort_order: index,
      updated_by: user.id,
      content: {
        id: a.id,
        rounds: allContent[a.id].rounds.map((r) =>
          r.words
            ? {
                prompt: r.prompt,
                hint: r.hint,
                answer: r.answer,
                scene: r.scene,
                choices: [],
                sequence: sequencePictures(r.words),
              }
            : r,
        ),
      },
    }));
    const { data, error } = await db
      .from("learning_activities")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
      .select("id");
    if (error)
      throw new HttpError(
        503,
        "Execute a atualização do banco para importar as atividades.",
      );
    return NextResponse.json({ imported: data?.length ?? 0 });
  } catch (error) {
    return failure(error);
  }
}
