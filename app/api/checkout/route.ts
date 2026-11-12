import { isMasterUser } from "../../../lib/access";
import {
  failure,
  HttpError,
  requireOrigin,
  requireUser,
  stripeClient,
} from "../../../lib/server";
import { prepareCheckout } from "../../../lib/checkout";
import { isPlanId } from "../../../lib/plan";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    if (!process.env.STRIPE_WEBHOOK_SECRET)
      throw new HttpError(
        503,
        "A confirmação de pagamentos ainda não foi configurada. Nenhuma cobrança foi realizada.",
      );
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      throw new HttpError(400, "Escolha uma modalidade de pagamento.");
    }
    const selected = (input as { plan?: unknown })?.plan;
    if (!isPlanId(selected))
      throw new HttpError(400, "Escolha uma modalidade válida.");
    const { user, db } = await requireUser(request);
    if (isMasterUser(user.id))
      throw new HttpError(
        409,
        "Sua conta master já tem acesso às atividades, sem contratar assinatura.",
      );
    return await prepareCheckout(selected, user, db, stripeClient());
  } catch (error) {
    return failure(error);
  }
}
