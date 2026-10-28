import { NextResponse } from "next/server";
import { catalog } from "../../../../lib/catalog";
import { allContent } from "../../../../lib/activity-content";
import {
  customerId,
  failure,
  HttpError,
  requireUser,
  stripeClient,
} from "../../../../lib/server";
import { subscriptionFor } from "../../../../lib/billing";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const activity = catalog.find((a) => a.id === id);
    if (!activity)
      throw new HttpError(404, "Essa aventura não foi encontrada.");
    if (!activity.free) {
      const { user, db } = await requireUser(request);
      const customer = await customerId(db, user.id);
      if (
        !customer ||
        !(await subscriptionFor(stripeClient(), customer)).active
      )
        throw new HttpError(
          403,
          "Essa aventura faz parte da assinatura. Peça ao responsável para consultar o plano.",
        );
    }
    return NextResponse.json(allContent[id], {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
