import "server-only";
import type Stripe from "stripe";
import { hasAccess, matchesPlan } from "./plan";
import { HttpError } from "./server";
export async function monthlyPrice(stripe: Stripe) {
  const id = process.env.STRIPE_PRICE_ID;
  if (!id)
    throw new HttpError(503, "O plano mensal ainda não foi configurado.");
  const price = await stripe.prices.retrieve(id);
  if (!matchesPlan(price))
    throw new HttpError(
      503,
      "O plano está em revisão. Nenhuma cobrança foi realizada.",
    );
  return price;
}
export async function subscriptionFor(stripe: Stripe, customer: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer,
    status: "all",
    limit: 100,
  });
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId)
    throw new HttpError(503, "O plano mensal ainda não foi configurado.");
  const current = subscriptions.data.filter((s) =>
    s.items.data.some((item) => item.price.id === priceId),
  );
  const subscription =
    current.find((s) => hasAccess(s, priceId)) ??
    current.find(
      (s) => !["canceled", "incomplete_expired"].includes(s.status),
    ) ??
    current[0];
  return {
    subscription,
    active: !!subscription && hasAccess(subscription, priceId),
  };
}
