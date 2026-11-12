export const PLANS = {
  monthly: {
    amount: 5000,
    currency: "brl",
    interval: "month",
    label: "R$ 50,00",
    name: "Mensal",
    description: "R$ 50 por mês. Renovação automática até cancelar.",
    env: "STRIPE_PRICE_ID",
    mode: "subscription",
  },
  annual: {
    amount: 45000,
    currency: "brl",
    interval: "year",
    label: "R$ 450,00",
    name: "Anual com renovação",
    description:
      "R$ 450 por ano, cobrados de uma vez. Renovação anual automática até cancelar. Equivale a R$ 37,50/mês.",
    env: "STRIPE_ANNUAL_PRICE_ID",
    mode: "subscription",
  },
  yearly_pass: {
    amount: 50000,
    currency: "brl",
    interval: null,
    label: "R$ 500,00",
    name: "12 meses sem renovação",
    description:
      "Pagamento único de R$ 500 por 12 meses. Sem renovação automática. Equivale a aproximadamente R$ 41,67/mês.",
    env: "STRIPE_YEAR_PASS_PRICE_ID",
    mode: "payment",
  },
} as const;
export type PlanId = keyof typeof PLANS;
export const PLAN = PLANS.monthly;
export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && Object.hasOwn(PLANS, value);
}
export function matchesPlan(
  price: {
    active: boolean;
    unit_amount: number | null;
    currency: string;
    type: string;
    recurring?: { interval: string; interval_count: number } | null;
  },
  id: PlanId = "monthly",
) {
  const plan = PLANS[id];
  return (
    price.active &&
    price.unit_amount === plan.amount &&
    price.currency === plan.currency &&
    (plan.mode === "payment"
      ? price.type === "one_time" && !price.recurring
      : price.type === "recurring" &&
        price.recurring?.interval === plan.interval &&
        price.recurring.interval_count === 1)
  );
}
export function hasAccess(
  subscription: {
    status: string;
    items: { data: Array<{ price: { id: string } }> };
  },
  priceId: string,
) {
  return (
    ["active", "trialing"].includes(subscription.status) &&
    subscription.items.data.some((item) => item.price.id === priceId)
  );
}
export function passEnd(paidAt: number) {
  const start = new Date(paidAt * 1000);
  const end = new Date(start);
  end.setUTCFullYear(start.getUTCFullYear() + 1);
  // February 29 ends on February 28 in a non-leap year.
  if (end.getUTCMonth() !== start.getUTCMonth()) end.setUTCDate(0);
  return end.toISOString();
}
