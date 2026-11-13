import { testCheckoutEnabledFor } from "../../../lib/billing-test";
import { isMasterUser } from "../../../lib/access";
import {
  failure,
  HttpError,
  requireOrigin,
  requireUser,
  stripeClient,
} from "../../../lib/server";
import { prepareCheckout } from "../../../lib/checkout";
import { isAvailablePlanId } from "../../../lib/plan";
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
    if (!isAvailablePlanId(selected))
      throw new HttpError(400, "Escolha uma modalidade válida.");
    const requestedTest = (input as { testPurchase?: unknown })?.testPurchase;
    if (requestedTest !== undefined && typeof requestedTest !== "boolean")
      throw new HttpError(400, "Confira a opção de teste de compra.");
    const testPurchase =
      (input as { testPurchase?: unknown })?.testPurchase === true;
    const { user, db } = await requireUser(request);
    if (testPurchase && !testCheckoutEnabledFor(user.id))
      throw new HttpError(
        403,
        "O teste de compra é exclusivo da conta autorizada.",
      );
    if (isMasterUser(user.id) && !testPurchase)
      throw new HttpError(
        409,
        "Sua conta master já tem acesso às atividades, sem contratar assinatura.",
      );
    return await prepareCheckout(
      selected,
      user,
      db,
      stripeClient(),
      testPurchase,
    );
  } catch (error) {
    return failure(error);
  }
}
