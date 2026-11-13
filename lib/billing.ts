import "server-only";
import type Stripe from "stripe";
import { hasAccess, matchesPlan, PLANS, type PlanId } from "./plan";
import { HttpError, type adminDb } from "./server";
export function configuredPriceIds() {
  return Object.fromEntries(
    Object.entries(PLANS).map(([key, plan]) => [
      key,
      process.env[plan.env]?.trim(),
    ]),
  ) as Record<PlanId, string | undefined>;
}
export function planForPrice(id?: string | null): PlanId | undefined {
  return Object.entries(configuredPriceIds()).find(
    ([, value]) => value && value === id,
  )?.[0] as PlanId | undefined;
}
export async function planPrice(stripe: Stripe, id: PlanId) {
  const priceId = configuredPriceIds()[id];
  if (!priceId)
    throw new HttpError(
      503,
      `A opção ${PLANS[id].name} ainda não foi configurada.`,
    );
  const price = await stripe.prices.retrieve(priceId);
  if (!matchesPlan(price, id))
    throw new HttpError(
      503,
      "O preço está em revisão. Nenhuma cobrança foi realizada.",
    );
  return price;
}
export async function monthlyPrice(stripe: Stripe) {
  return planPrice(stripe, "monthly");
}
export async function subscriptionFor(stripe: Stripe, customer: string) {
  const current: Stripe.Subscription[] = [];
  const prices = configuredPriceIds();
  const eligiblePrices = [
    prices.monthly,
    prices.annual,
    process.env.STRIPE_TEST_PRICE_ID?.trim(),
  ].filter(Boolean);
  for await (const s of stripe.subscriptions.list({
    customer,
    status: "all",
    limit: 100,
  })) {
    if (s.items.data.some((item) => eligiblePrices.includes(item.price.id)))
      current.push(s);
  }
  const allowed = (s: Stripe.Subscription) =>
    eligiblePrices.some((id) => !!id && hasAccess(s, id));
  const subscription =
    current.find(allowed) ??
    current.find(
      (s) => !["canceled", "incomplete_expired"].includes(s.status),
    ) ??
    current[0];
  const isTestSubscription =
    !!subscription &&
    !!process.env.STRIPE_TEST_PRICE_ID?.trim() &&
    subscription.items.data.some(
      (item) => item.price.id === process.env.STRIPE_TEST_PRICE_ID?.trim(),
    );
  return {
    subscription,
    isTestSubscription,
    active: !!subscription && allowed(subscription),
    plan: isTestSubscription
      ? ("monthly" as const)
      : subscription
        ? planForPrice(subscription.items.data[0]?.price.id)
        : undefined,
  };
}
export async function activePass(
  db: ReturnType<typeof adminDb>,
  userId: string,
) {
  const { data, error } = await db
    .from("access_passes")
    .select("ends_at,starts_at,stripe_session_id")
    .eq("user_id", userId)
    .eq("revoked", false)
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    throw new HttpError(
      503,
      "Atualize o banco de dados para consultar os planos e acessos.",
    );
  return data;
}
