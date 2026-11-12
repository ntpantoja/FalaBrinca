import test from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import { prepareCheckout } from "../lib/checkout";
import { processStripeEvent } from "../lib/stripe-events";
import type { adminDb } from "../lib/server";
import { PLANS, AVAILABLE_PLAN_IDS } from "../lib/plan";
process.env.APP_URL = "http://localhost:3000";
process.env.STRIPE_PRICE_ID = "price_monthly";
process.env.STRIPE_ANNUAL_PRICE_ID = "price_annual";
process.env.STRIPE_YEAR_PASS_PRICE_ID = "price_pass";
const user = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "family@example.test",
} as User;
function fixture() {
  const state = {
    pass: false,
    lockBusy: false,
    writeError: false,
    missingCustomer: false,
    subscriptions: [] as unknown[],
    open: [] as unknown[],
    completed: [] as unknown[],
    created: [] as Record<string, unknown>[],
    expired: [] as string[],
    writes: [] as { name: string; data: Record<string, unknown> }[],
    canonical: {} as Record<string, unknown>,
    charge: {} as Record<string, unknown>,
    invoice: {} as Record<string, unknown>,
  };
  const db = {
    from(name: string) {
      let data: Record<string, unknown> = {};
      const query = {
        select() {
          return query;
        },
        eq() {
          return query;
        },
        gt() {
          return query;
        },
        order() {
          return query;
        },
        limit() {
          return query;
        },
        delete() {
          return query;
        },
        upsert(value: Record<string, unknown>) {
          data = value;
          state.writes.push({ name, data });
          return query;
        },
        async maybeSingle() {
          return {
            data:
              name === "access_passes"
                ? state.pass
                  ? { ends_at: "2030-01-01" }
                  : null
                : name === "billing_customers"
                  ? state.missingCustomer
                    ? null
                    : { stripe_customer_id: "cus_test", user_id: user.id }
                  : null,
            error: null,
          };
        },
        then(
          resolve: (value: unknown) => unknown,
          reject: (error: unknown) => unknown,
        ) {
          return Promise.resolve({
            data: null,
            error: state.writeError ? {} : null,
          }).then(resolve, reject);
        },
      };
      return query;
    },
    async rpc(name: string, data: Record<string, unknown>) {
      state.writes.push({ name, data });
      return {
        data:
          name === "acquire_checkout_lock"
            ? state.lockBusy
              ? null
              : "lock_fixture"
            : null,
        error: state.writeError ? {} : null,
      };
    },
  } as unknown as ReturnType<typeof adminDb>;
  const list = (rows: unknown[]) => ({
    data: rows,
    [Symbol.asyncIterator]: async function* () {
      yield* rows;
    },
  });
  const stripe = {
    paymentIntents: {
      async retrieve() {
        return { status: "requires_payment_method" };
      },
    },
    prices: {
      async retrieve(id: string) {
        const key =
          id === "price_monthly"
            ? "monthly"
            : id === "price_annual"
              ? "annual"
              : "yearly_pass";
        const p = PLANS[key];
        return {
          id,
          active: true,
          unit_amount: p.amount,
          currency: "brl",
          type: p.mode === "payment" ? "one_time" : "recurring",
          recurring: p.interval
            ? { interval: p.interval, interval_count: 1 }
            : null,
        };
      },
    },
    subscriptions: {
      list() {
        return list(state.subscriptions);
      },
    },
    checkout: {
      sessions: {
        list(options: { status: string }) {
          return list(options.status === "open" ? state.open : state.completed);
        },
        async create(payload: Record<string, unknown>) {
          state.created.push(payload);
          return { id: "cs_new", url: "https://checkout.stripe.test/fixture" };
        },
        async expire(id: string) {
          state.expired.push(id);
        },
        async retrieve() {
          return state.canonical;
        },
      },
    },
    charges: {
      async retrieve() {
        return state.charge;
      },
    },
    invoices: {
      async retrieve() {
        return state.invoice;
      },
    },
  } as unknown as Stripe;
  return { state, db, stripe };
}
function paidEvent(
  type = "checkout.session.completed",
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "evt_paid",
    type,
    created: 1794484800,
    data: {
      object: {
        id: "cs_paid",
        customer: "cus_test",
        mode: "payment",
        payment_status: "paid",
        metadata: { app: "falabrinca", plan: "yearly_pass" },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}
function canonical() {
  return {
    id: "cs_paid",
    customer: "cus_test",
    client_reference_id: user.id,
    mode: "payment",
    payment_status: "paid",
    currency: "brl",
    amount_total: 50000,
    payment_intent: "pi_paid",
    metadata: { app: "falabrinca", plan: "yearly_pass" },
    line_items: {
      data: [
        {
          quantity: 1,
          price: {
            id: "price_pass",
            active: true,
            type: "one_time",
            currency: "brl",
            unit_amount: 50000,
            recurring: null,
          },
        },
      ],
    },
  };
}
test("checkout oferece somente as assinaturas mensal e anual", async () => {
  for (const plan of AVAILABLE_PLAN_IDS) {
    const { state, db, stripe } = fixture();
    const response = await prepareCheckout(plan, user, db, stripe);
    assert.equal(response.status, 200);
    assert.equal(state.created.length, 1);
    const payload = state.created[0];
    assert.equal(payload.mode, PLANS[plan].mode);
    assert.deepEqual(payload.line_items, [
      { price: process.env[PLANS[plan].env], quantity: 1 },
    ]);
    assert.equal(Object.hasOwn(payload, "subscription_data"), true);
    assert.equal(Object.hasOwn(payload, "payment_intent_data"), false);
  }
});
test("checkout bloqueia compra duplicada, pagamento concorrente e assinatura pendente", async () => {
  for (const situation of ["pass", "lock", "subscription"]) {
    const { state, db, stripe } = fixture();
    state.pass = situation === "pass";
    state.lockBusy = situation === "lock";
    if (situation === "subscription")
      state.subscriptions = [
        {
          id: "sub1",
          status: "past_due",
          items: { data: [{ price: { id: "price_monthly" } }] },
        },
      ];
    await assert.rejects(() => prepareCheckout("annual", user, db, stripe), {
      status: 409,
    });
    assert.equal(state.created.length, 0);
  }
});
test("trocar modalidade expira checkout antigo e sessão existente do mesmo preço é reutilizada", async () => {
  const { state, db, stripe } = fixture();
  state.open = [
    {
      id: "cs_old",
      mode: "subscription",
      metadata: { app: "falabrinca", price_id: "price_monthly" },
    },
  ];
  await prepareCheckout("annual", user, db, stripe);
  assert.deepEqual(state.expired, ["cs_old"]);
  const other = fixture();
  other.state.open = [
    {
      id: "cs_existing",
      url: "https://stripe.test/existing",
      mode: "subscription",
      metadata: { app: "falabrinca", price_id: "price_annual" },
    },
  ];
  assert.equal(
    (
      await (
        await prepareCheckout("annual", user, other.db, other.stripe)
      ).json()
    ).url,
    "https://stripe.test/existing",
  );
  assert.equal(other.state.created.length, 0);
});
test("webhook pago e canônico libera um ano; conclusão não paga não libera", async () => {
  const { state, db, stripe } = fixture();
  state.canonical = canonical();
  assert.equal((await processStripeEvent(paidEvent(), stripe, db)).status, 200);
  const write = state.writes.find((w) => w.name === "apply_pass_payment")!;
  assert.ok(write);
  assert.equal(write.data.p_user_id, user.id);
  assert.equal(write.data.p_amount, 50000);
  assert.equal(write.data.p_ends_at, "2027-11-12T12:00:00.000Z");
  state.writes = [];
  assert.equal(
    (
      await processStripeEvent(
        paidEvent("checkout.session.completed", { payment_status: "unpaid" }),
        stripe,
        db,
      )
    ).status,
    200,
  );
  assert.equal(state.writes.length, 0);
  assert.equal(
    (
      await processStripeEvent(
        paidEvent("checkout.session.async_payment_succeeded"),
        stripe,
        db,
      )
    ).status,
    200,
  );
  assert.ok(state.writes.some((w) => w.name === "apply_pass_payment"));
});
test("webhook rejeita conta, moeda, valor, preço ou quantidade divergentes", async () => {
  for (const changed of [
    { client_reference_id: "another_user" },
    { currency: "usd" },
    { amount_total: 25000 },
    { line_items: { data: [{ quantity: 2, price: { id: "price_pass" } }] } },
    {
      line_items: { data: [{ quantity: 1, price: { id: "price_unrelated" } }] },
    },
  ]) {
    const { state, db, stripe } = fixture();
    state.canonical = { ...canonical(), ...changed };
    assert.equal(
      (await processStripeEvent(paidEvent(), stripe, db)).status,
      400,
    );
    assert.ok(!state.writes.some((w) => w.name === "apply_pass_payment"));
  }
});
test("falha ao persistir pede nova entrega do webhook e reembolso usa estado atual do Stripe", async () => {
  const { state, db, stripe } = fixture();
  state.canonical = canonical();
  state.writeError = true;
  assert.equal((await processStripeEvent(paidEvent(), stripe, db)).status, 503);
  state.writeError = false;
  state.charge = {
    payment_intent: "pi_paid",
    amount_refunded: 50000,
    refunded: true,
  };
  assert.equal(
    (
      await processStripeEvent(
        paidEvent("charge.refunded", { id: "ch_paid" }),
        stripe,
        db,
      )
    ).status,
    200,
  );
  assert.deepEqual(state.writes.at(-1)?.data, {
    p_intent_id: "pi_paid",
    p_amount: 50000,
    p_full: true,
  });
});
test("fatura anual registra recebimento real sem confundir com cobrança mensal", async () => {
  const { state, db, stripe } = fixture();
  state.invoice = {
    id: "in_paid",
    status: "paid",
    currency: "brl",
    amount_paid: 45000,
    status_transitions: { paid_at: 1794484800 },
    lines: {
      data: [{ pricing: { price_details: { price: "price_annual" } } }],
    },
    payments: {
      data: [{ status: "paid", payment: { payment_intent: "pi_invoice" } }],
    },
  };
  assert.equal(
    (
      await processStripeEvent(
        paidEvent("invoice.paid", { id: "in_paid" }),
        stripe,
        db,
      )
    ).status,
    200,
  );
  const receipt = state.writes.find((w) => w.name === "payment_receipts")!;
  assert.equal(receipt.data.plan, "annual");
  assert.equal(receipt.data.amount_paid, 45000);
  assert.equal(receipt.data.payment_intent_id, "pi_invoice");
});

test("passe antigo com pagamento assíncrono falho não impede nova assinatura", async () => {
  const { state, db, stripe } = fixture();
  state.completed = [
    {
      mode: "payment",
      metadata: { plan: "yearly_pass" },
      payment_status: "unpaid",
      payment_intent: "pi_failed",
      created: Math.floor(Date.now() / 1000),
    },
  ];
  await prepareCheckout("monthly", user, db, stripe);
  assert.equal(state.created.length, 1);
});

test("pagamento único retirado é rejeitado no servidor antes de criar checkout", async () => {
  const { state, db, stripe } = fixture();
  await assert.rejects(() => prepareCheckout("yearly_pass", user, db, stripe), {
    status: 400,
  });
  assert.equal(state.created.length, 0);
  assert.equal(state.writes.length, 0);
});
