import "server-only";
import { billingTestPrice } from "./billing-test";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import { appUrl, customerId, HttpError, type adminDb } from "./server";
import { activePass, planPrice, subscriptionFor } from "./billing";
import { PLANS, passEnd, isAvailablePlanId, type PlanId } from "./plan";
export async function prepareCheckout(
  selected: PlanId,
  user: User,
  db: ReturnType<typeof adminDb>,
  stripe: Stripe,
  testPurchase = false,
) {
  if (!isAvailablePlanId(selected))
    throw new HttpError(
      400,
      "Escolha o plano mensal ou anual. O pagamento único não está mais à venda.",
    );
  let release: (() => Promise<void>) | undefined;
  try {
    if (testPurchase && selected !== "monthly")
      throw new HttpError(
        400,
        "O teste de R$ 5 usa apenas a modalidade mensal.",
      );
    const price = testPurchase
      ? await billingTestPrice(stripe, user.id)
      : await planPrice(stripe, selected);
    const lock = await db.rpc("acquire_checkout_lock", { p_user_id: user.id });
    if (lock.error)
      throw new HttpError(
        503,
        "Atualize o banco de dados antes de iniciar um pagamento.",
      );
    if (!lock.data)
      throw new HttpError(
        409,
        "Já estamos preparando um pagamento para esta conta. Aguarde um instante.",
      );
    release = async () => {
      await db
        .from("checkout_locks")
        .delete()
        .eq("user_id", user.id)
        .eq("lock_id", lock.data);
    };
    if (await activePass(db, user.id))
      throw new HttpError(
        409,
        "Sua conta já tem acesso pago válido. Não é necessário comprar novamente.",
      );
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
        throw new HttpError(503, "Não foi possível preparar seu pagamento.");
      customer = created.id;
    }
    const { subscription } = await subscriptionFor(stripe, customer);
    if (
      subscription &&
      !["canceled", "incomplete_expired"].includes(subscription.status)
    )
      throw new HttpError(
        409,
        "Você já tem uma assinatura em andamento. Use Gerenciar assinatura.",
      );
    // A pending asynchronous payment or a newly paid pass must not start another purchase.
    for await (const session of stripe.checkout.sessions.list({
      customer,
      status: "complete",
      limit: 100,
    })) {
      if (
        session.mode === "payment" &&
        session.metadata?.plan === "yearly_pass" &&
        session.payment_status !== "no_payment_required" &&
        new Date(passEnd(session.created)).getTime() > Date.now()
      ) {
        const intentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        if (session.payment_status === "unpaid" && intentId) {
          const intent = await stripe.paymentIntents.retrieve(intentId);
          if (["canceled", "requires_payment_method"].includes(intent.status))
            continue;
        }
        const refund = intentId
          ? await db
              .from("payment_refunds")
              .select("fully_refunded")
              .eq("payment_intent_id", intentId)
              .maybeSingle()
          : null;
        if (refund?.error)
          throw new HttpError(
            503,
            "Não foi possível verificar o pagamento anterior.",
          );
        if (!refund?.data?.fully_refunded)
          throw new HttpError(
            409,
            "Há um pagamento anterior em confirmação ou um acesso válido. Atualize o status na sua conta antes de comprar novamente.",
          );
      }
    }
    const open = await stripe.checkout.sessions.list({
      customer,
      status: "open",
      limit: 100,
    });
    const existing = open.data.find(
      (s) =>
        s.metadata?.price_id === price.id && s.mode === PLANS[selected].mode,
    );
    for (const old of open.data)
      if (old.id !== existing?.id && old.metadata?.app === "falabrinca")
        await stripe.checkout.sessions.expire(old.id);
    if (existing?.url) return NextResponse.json({ url: existing.url });
    const metadata = {
      app: "falabrinca",
      plan: selected,
      price_id: price.id,
      supabase_user_id: user.id,
      ...(testPurchase ? { test_purchase: "true" } : {}),
    };
    const session = await stripe.checkout.sessions.create(
      {
        mode: PLANS[selected].mode,
        customer,
        client_reference_id: user.id,
        line_items: [{ price: price.id, quantity: 1 }],
        allow_promotion_codes: false,
        locale: "pt-BR",
        success_url: `${appUrl()}/conta?${testPurchase ? "gerenciar=1&" : ""}checkout=success`,
        cancel_url: `${appUrl()}/conta?${testPurchase ? "gerenciar=1&" : ""}checkout=cancelled`,
        metadata,
        ...(PLANS[selected].mode === "subscription"
          ? { subscription_data: { metadata } }
          : { payment_intent_data: { metadata } }),
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      },
      { idempotencyKey: `checkout-${user.id}-${lock.data}` },
    );
    return NextResponse.json({ url: session.url });
  } finally {
    await release?.();
  }
}
