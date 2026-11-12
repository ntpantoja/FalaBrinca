import "server-only";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { failure, HttpError, type adminDb } from "./server";
import { planForPrice, configuredPriceIds } from "./billing";
import { matchesPlan, passEnd } from "./plan";
const customerId = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : value?.id;
export const SUPPORTED_BILLING_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "invoice.paid",
  "charge.refunded",
];
export async function processStripeEvent(
  event: Stripe.Event,
  stripe: Stripe,
  db: ReturnType<typeof adminDb>,
) {
  try {
    if (!(SUPPORTED_BILLING_EVENTS as readonly string[]).includes(event.type))
      return NextResponse.json({ received: true });
    if (event.type === "charge.refunded") {
      const charge = await stripe.charges.retrieve(
        (event.data.object as Stripe.Charge).id,
      );
      const intent = customerId(charge.payment_intent);
      if (intent) {
        const { error } = await db.rpc("apply_payment_refund", {
          p_intent_id: intent,
          p_amount: charge.amount_refunded,
          p_full: charge.refunded,
        });
        if (error)
          throw new HttpError(
            503,
            "Não foi possível registrar o reembolso. Reenvie o evento.",
          );
      }
      return NextResponse.json({ received: true });
    }
    const object = event.data.object as
      Stripe.Subscription | Stripe.Checkout.Session | Stripe.Invoice;
    const customer = customerId(object.customer);
    const { data, error } = await db
      .from("billing_customers")
      .select("user_id")
      .eq("stripe_customer_id", customer ?? "")
      .maybeSingle();
    if (error)
      throw new HttpError(
        503,
        "Vínculo do pagamento indisponível. Reenvie o evento.",
      );
    if (!data) {
      if (
        object.metadata?.app === "falabrinca" ||
        event.type.startsWith("customer.subscription.")
      )
        throw new HttpError(
          503,
          "Vínculo do pagamento indisponível. Reenvie o evento.",
        );
      return NextResponse.json({ received: true });
    }
    if (event.type.startsWith("customer.subscription.")) {
      const subscription = object as Stripe.Subscription;
      const { error: writeError } = await db.rpc("apply_subscription_event", {
        p_event_id: event.id,
        p_event_created: event.created,
        p_user_id: data.user_id,
        p_subscription_id: subscription.id,
        p_status: subscription.status,
        p_price_id: subscription.items.data[0]?.price.id ?? null,
        p_period_end: subscription.items.data[0]?.current_period_end ?? null,
        p_cancel_at_period_end: subscription.cancel_at_period_end,
      });
      if (writeError)
        throw new HttpError(
          503,
          "Não foi possível registrar a assinatura. Reenvie o evento.",
        );
    } else if (event.type.startsWith("checkout.session.")) {
      const notification = object as Stripe.Checkout.Session;
      // Do not grant access for an unpaid completion, even if a later retry sees a paid session.
      if (
        notification.mode !== "payment" ||
        notification.payment_status !== "paid" ||
        notification.metadata?.app !== "falabrinca"
      )
        return NextResponse.json({ received: true });
      const session = await stripe.checkout.sessions.retrieve(notification.id, {
        expand: ["line_items.data.price"],
      });
      const item = session.line_items?.data[0];
      if (
        session.mode !== "payment" ||
        session.payment_status !== "paid" ||
        session.currency !== "brl" ||
        session.amount_total !== 50000 ||
        session.client_reference_id !== data.user_id ||
        customerId(session.customer) !== customer ||
        session.metadata?.plan !== "yearly_pass" ||
        session.line_items?.data.length !== 1 ||
        item?.quantity !== 1 ||
        !item.price ||
        item.price.id !== configuredPriceIds().yearly_pass ||
        !matchesPlan({ ...item.price, active: true }, "yearly_pass")
      )
        throw new HttpError(
          400,
          "O pagamento não corresponde ao passe de 12 meses desta conta.",
        );
      const intent = customerId(session.payment_intent);
      if (!intent)
        throw new HttpError(503, "Aguardando identificação do pagamento.");
      const { error: writeError } = await db.rpc("apply_pass_payment", {
        p_event_id: event.id,
        p_user_id: data.user_id,
        p_session_id: session.id,
        p_intent_id: intent,
        p_price_id: item.price.id,
        p_paid_at: new Date(event.created * 1000).toISOString(),
        p_ends_at: passEnd(event.created),
        p_amount: session.amount_total,
      });
      if (writeError)
        throw new HttpError(
          503,
          "Não foi possível liberar os 12 meses. Reenvie o evento.",
        );
    } else if (event.type === "invoice.paid") {
      const invoice = await stripe.invoices.retrieve(object.id, {
        expand: ["payments"],
      });
      if (
        invoice.status !== "paid" ||
        invoice.currency !== "brl" ||
        !invoice.amount_paid
      )
        return NextResponse.json({ received: true });
      const price = invoice.lines.data
        .map((line) => customerId(line.pricing?.price_details?.price ?? null))
        .find(
          (id) =>
            !!id && ["monthly", "annual"].includes(planForPrice(id) ?? ""),
        );
      const plan = price ? planForPrice(price) : undefined;
      if (!plan) return NextResponse.json({ received: true });
      const payment = invoice.payments?.data.find((p) => p.status === "paid");
      const intent = payment?.payment.payment_intent;
      const { error: writeError } = await db.from("payment_receipts").upsert(
        {
          source_id: invoice.id,
          user_id: data.user_id,
          plan,
          amount_paid: invoice.amount_paid,
          currency: "brl",
          payment_intent_id: intent ? customerId(intent) : null,
          paid_at: new Date(
            (invoice.status_transitions.paid_at ?? event.created) * 1000,
          ).toISOString(),
        },
        { onConflict: "source_id", ignoreDuplicates: true },
      );
      if (writeError)
        throw new HttpError(
          503,
          "Não foi possível registrar o recebimento. Reenvie o evento.",
        );
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return failure(error);
  }
}
