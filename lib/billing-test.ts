import "server-only";
import type Stripe from "stripe";
import { HttpError } from "./server";
export function testCheckoutEnabledFor(userId: string) {
  if (process.env.BILLING_TEST_ENABLED?.trim().toLowerCase() === "false")
    return false;
  const allowed =
    process.env.BILLING_TEST_USER_ID?.trim() ||
    process.env.MASTER_USER_ID?.trim();
  return (
    !!process.env.STRIPE_TEST_PRICE_ID?.trim() &&
    !!allowed &&
    userId === allowed
  );
}
export function matchesTestPrice(price: {
  active: boolean;
  unit_amount: number | null;
  currency: string;
  type: string;
  recurring?: { interval: string; interval_count: number } | null;
}) {
  return (
    price.active &&
    price.unit_amount === 500 &&
    price.currency === "brl" &&
    price.type === "recurring" &&
    price.recurring?.interval === "month" &&
    price.recurring.interval_count === 1
  );
}
export async function billingTestPrice(stripe: Stripe, userId: string) {
  if (!testCheckoutEnabledFor(userId))
    throw new HttpError(
      403,
      "O teste de compra é exclusivo da conta autorizada.",
    );
  const testId = process.env.STRIPE_TEST_PRICE_ID!.trim();
  if (
    [
      process.env.STRIPE_PRICE_ID?.trim(),
      process.env.STRIPE_ANNUAL_PRICE_ID?.trim(),
    ].includes(testId)
  )
    throw new HttpError(
      503,
      "Use um preço separado para o teste de R$ 5. Preserve os IDs dos planos normais.",
    );
  const price = await stripe.prices.retrieve(
    process.env.STRIPE_TEST_PRICE_ID!.trim(),
  );
  if (!matchesTestPrice(price))
    throw new HttpError(
      503,
      "Configure um preço de teste de R$ 5,00, em BRL, recorrente mensal. Nenhuma cobrança foi realizada.",
    );
  return price;
}
