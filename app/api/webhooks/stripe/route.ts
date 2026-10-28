import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  adminDb,
  failure,
  HttpError,
  stripeClient,
} from "../../../../lib/server";
export async function POST(request: Request) {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signingSecret)
    return NextResponse.json(
      { error: "Webhook não configurado." },
      { status: 503 },
    );
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      signingSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Assinatura do evento inválida." },
      { status: 400 },
    );
  }
  if (
    ![
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ].includes(event.type)
  )
    return NextResponse.json({ received: true });
  try {
    const subscription = event.data.object as Stripe.Subscription;
    const customer =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const db = adminDb();
    const { data, error } = await db
      .from("billing_customers")
      .select("user_id")
      .eq("stripe_customer_id", customer)
      .maybeSingle();
    if (error || !data)
      throw new HttpError(
        503,
        "Vínculo da assinatura indisponível. Reenvie o evento.",
      );
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
        "Não foi possível registrar o evento. Reenvie o evento.",
      );
    return NextResponse.json({ received: true });
  } catch (error) {
    return failure(error);
  }
}
