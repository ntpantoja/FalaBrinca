export const PLAN = {
  amount: 5000,
  currency: "brl",
  interval: "month",
  label: "R$ 50,00",
  name: "Exploradores do Dino",
} as const;
export function matchesPlan(price: {
  active: boolean;
  unit_amount: number | null;
  currency: string;
  type: string;
  recurring?: { interval: string; interval_count: number } | null;
}) {
  return (
    price.active &&
    price.type === "recurring" &&
    price.unit_amount === PLAN.amount &&
    price.currency === PLAN.currency &&
    price.recurring?.interval === "month" &&
    price.recurring.interval_count === 1
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
