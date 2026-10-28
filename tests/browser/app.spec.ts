import { test, expect } from "@playwright/test";
import Stripe from "stripe";
test("o link abre direto o cadastro e a assinatura, sem apresentação ou acesso a jogos", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".auth-entry")).toBeVisible();
  await expect(page.locator(".entry-plan .price")).toContainText("R$ 50,00");
  await expect(page.locator(".marketing-main")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Começar Atividade" }),
  ).toHaveCount(0);
  await expect(page.locator(".dino-illustration")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("conteúdo e painel permanecem protegidos antes do pagamento", async ({
  request,
}) => {
  for (const path of [
    "/api/access",
    "/api/library",
    "/api/activities/figuras-inicio",
    "/api/activities/frutas",
    "/api/activities/premium",
    "/api/admin/activities",
  ])
    expect((await request.get(path)).status()).toBe(401);
  for (const path of [
    "/api/admin/seed",
    "/api/admin/activities",
    "/api/admin/media",
  ])
    expect(
      (
        await request.post(path, {
          headers: { Origin: "http://localhost:3100" },
          data: {},
        })
      ).status(),
    ).toBe(401);
  expect(
    (
      await request.put("/api/admin/activities/x", {
        headers: { Origin: "https://outro.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
});
test("serviço indisponível não libera conteúdo ou edição por fallback", async ({
  page,
}) => {
  await page.goto("/atividades");
  await expect(page.getByRole("status")).toContainText("configurado");
  await expect(
    page.getByRole("button", { name: "Começar Atividade" }),
  ).toHaveCount(0);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Acesso master necessário" }),
  ).toBeVisible();
});
test("webhook rejeita assinatura inválida e pede reenvio sem persistência", async ({
  request,
}) => {
  const stripe = new Stripe("sk_test_local_fixture");
  expect(
    (await request.post("/api/webhooks/stripe", { data: "{}" })).status(),
  ).toBe(400);
  const payload = JSON.stringify({
    id: "evt_fixture",
    type: "customer.subscription.updated",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "sub_fixture",
        customer: "cus_fixture",
        status: "active",
        cancel_at_period_end: false,
        items: {
          data: [
            { price: { id: "price_fixture" }, current_period_end: 1800000000 },
          ],
        },
      },
    },
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: "whsec_local_fixture",
  });
  expect(
    (
      await request.post("/api/webhooks/stripe", {
        data: payload,
        headers: {
          "stripe-signature": signature,
          "Content-Type": "application/json",
        },
      })
    ).status(),
  ).toBe(503);
});
test("PWA não guarda páginas de cadastro, pagamento, painel ou atividades", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  for (const path of ["/conta", "/admin", "/atividades"]) await page.goto(path);
  const paths = await page.evaluate(async () => {
    const keys = await caches.keys();
    return (
      await Promise.all(
        keys.map(async (key) =>
          (await (await caches.open(key)).keys()).map(
            (r) => new URL(r.url).pathname,
          ),
        ),
      )
    ).flat();
  });
  for (const path of ["/", "/conta", "/admin", "/atividades"])
    expect(paths).not.toContain(path);
  expect(paths.some((p) => p.startsWith("/api/"))).toBe(false);
});
