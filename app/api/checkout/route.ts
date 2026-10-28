import { NextResponse } from "next/server";
import {
  appUrl,
  customerId,
  failure,
  HttpError,
  requireOrigin,
  requireUser,
  stripeClient,
} from "../../../lib/server";
import { monthlyPrice, subscriptionFor } from "../../../lib/billing";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    if (!process.env.STRIPE_WEBHOOK_SECRET)
      throw new HttpError(
        503,
        "A confirmação de pagamentos ainda não foi configurada. Nenhuma cobrança foi realizada.",
      );
    const { user, db } = await requireUser(request);
    const stripe = stripeClient();
    const price = await monthlyPrice(stripe);
    let customer = await customerId(db, user.id);
    if (!customer) {
      const created = await stripe.customers.create(
        { email: user.email, metadata: { supabase_user_id: user.id } },
        { idempotencyKey: `falabrinca-customer-${user.id}` },
      );
      const { error } = await db
        .from("billing_customers")
        .upsert(
          { user_id: user.id, stripe_customer_id: created.id },
          { onConflict: "user_id" },
        );
      if (error)
        throw new HttpError(503, "Não foi possível preparar sua assinatura.");
      customer = created.id;
    }
    const { subscription } = await subscriptionFor(stripe, customer);
    if (
      subscription &&
      !["canceled", "incomplete_expired"].includes(subscription.status)
    )
      throw new HttpError(
        409,
        "Você já tem uma assinatura em andamento. Use “Gerenciar assinatura”.",
      );
    const open = await stripe.checkout.sessions.list({
      customer,
      status: "open",
      limit: 10,
    });
    const existing = open.data.find(
      (session) =>
        session.metadata?.price_id === price.id &&
        session.mode === "subscription",
    );
    if (existing?.url) return NextResponse.json({ url: existing.url });
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer,
        client_reference_id: user.id,
        line_items: [{ price: price.id, quantity: 1 }],
        allow_promotion_codes: false,
        locale: "pt-BR",
        success_url: `${appUrl()}/conta?checkout=success`,
        cancel_url: `${appUrl()}/conta?checkout=cancelled`,
        metadata: { price_id: price.id },
        subscription_data: { metadata: { supabase_user_id: user.id } },
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      },
      {
        idempotencyKey: `checkout-${user.id}-${Math.floor(Date.now() / 1800000)}`,
      },
    );
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return failure(error);
  }
}
