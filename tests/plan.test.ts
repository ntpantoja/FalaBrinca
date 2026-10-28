import test from "node:test";
import assert from "node:assert/strict";
import { matchesPlan, hasAccess } from "../lib/plan.ts";
const price = {
  active: true,
  unit_amount: 5000,
  currency: "brl",
  type: "recurring",
  recurring: { interval: "month", interval_count: 1 },
};
test("só aceita preço ativo de R$ 50 por mês em BRL", () => {
  assert.equal(matchesPlan(price), true);
  for (const override of [
    { active: false },
    { unit_amount: 500 },
    { currency: "usd" },
    { type: "one_time" },
    { recurring: { interval: "year", interval_count: 1 } },
    { recurring: { interval: "month", interval_count: 3 } },
    { recurring: null },
  ])
    assert.equal(matchesPlan({ ...price, ...override }), false);
});
test("acesso exige assinatura ativa ou teste e o preço correto", () => {
  const subscription = {
    status: "active",
    items: { data: [{ price: { id: "price_expected" } }] },
  };
  assert.equal(hasAccess(subscription, "price_expected"), true);
  assert.equal(
    hasAccess({ ...subscription, status: "trialing" }, "price_expected"),
    true,
  );
  for (const status of [
    "past_due",
    "unpaid",
    "paused",
    "canceled",
    "incomplete",
    "incomplete_expired",
  ])
    assert.equal(
      hasAccess({ ...subscription, status }, "price_expected"),
      false,
    );
  assert.equal(hasAccess(subscription, "price_other"), false);
  assert.equal(
    hasAccess({ ...subscription, items: { data: [] } }, "price_expected"),
    false,
  );
});
