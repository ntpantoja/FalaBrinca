import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { adminDb, failure, stripeClient } from "../../../../lib/server";
import {
  processStripeEvent,
  SUPPORTED_BILLING_EVENTS,
} from "../../../../lib/stripe-events";
export async function POST(request: Request) {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signingSecret)
    return NextResponse.json(
      { error: "Webhook não configurado." },
      { status: 503 },
    );
  let event: Stripe.Event;
  let stripe: Stripe;
  try {
    stripe = stripeClient();
  } catch (error) {
    return failure(error);
  }
  try {
    event = stripe.webhooks.constructEvent(
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
  if (!(SUPPORTED_BILLING_EVENTS as readonly string[]).includes(event.type))
    return NextResponse.json({ received: true });
  try {
    return await processStripeEvent(event, stripe, adminDb());
  } catch (error) {
    return failure(error);
  }
}
