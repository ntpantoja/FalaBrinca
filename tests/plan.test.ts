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

import { PLANS, isPlanId, passEnd } from "../lib/plan.ts";
import { estimateSales } from "../lib/commercial.ts";
test("três preços distintos exigem intervalo correto e pagamento único não pode ser recorrente", () => {
  assert.equal(PLANS.annual.amount, 45000);
  assert.equal(PLANS.yearly_pass.amount, 50000);
  const yearly = {
    ...price,
    unit_amount: 45000,
    recurring: { interval: "year", interval_count: 1 },
  };
  assert.equal(matchesPlan(yearly, "annual"), true);
  assert.equal(matchesPlan(yearly, "monthly"), false);
  assert.equal(
    matchesPlan(
      { ...yearly, recurring: { interval: "month", interval_count: 1 } },
      "annual",
    ),
    false,
  );
  const pass = {
    ...price,
    unit_amount: 50000,
    type: "one_time",
    recurring: null,
  };
  assert.equal(matchesPlan(pass, "yearly_pass"), true);
  assert.equal(
    matchesPlan(
      {
        ...pass,
        type: "recurring",
        recurring: { interval: "year", interval_count: 1 },
      },
      "yearly_pass",
    ),
    false,
  );
  assert.equal(isPlanId("discount"), false);
  assert.equal(isPlanId("annual"), true);
});
test("passe termina em um ano de calendário e trata 29 de fevereiro", () => {
  assert.equal(
    passEnd(Date.parse("2024-02-29T10:00:00Z") / 1000),
    "2025-02-28T10:00:00.000Z",
  );
  assert.equal(
    passEnd(Date.parse("2026-11-12T10:00:00Z") / 1000),
    "2027-11-12T10:00:00.000Z",
  );
});
test("simulação separa entrada de caixa, recorrência e equivalente dos passes", () => {
  const value = estimateSales(10, 2, 3, 100, 5, 2);
  assert.equal(value.gross, 2900);
  assert.equal(value.mrr, 575);
  assert.equal(value.passEquivalent, 125);
  assert.equal(value.estimatedBalance, 2625);
});
