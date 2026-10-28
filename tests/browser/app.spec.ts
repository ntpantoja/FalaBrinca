import { test, expect } from "@playwright/test";
import Stripe from "stripe";
test("tela inicial apresenta plano, cadastro e login sem teste ou mascote", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Pequenas palavras/ }),
  ).toBeVisible();
  await expect(page.locator(".hero-price")).toContainText("R$ 50,00");
  await expect(
    page.getByRole("link", { name: "Entrar", exact: true }),
  ).toHaveAttribute("href", "/conta?modo=login");
  await expect(
    page.getByRole("link", { name: "Criar minha conta" }),
  ).toHaveAttribute("href", "/conta?modo=cadastro");
  await expect(
    page.getByRole("button", { name: "Começar a brincar" }),
  ).toHaveCount(0);
  await expect(page.locator(".adventure-card")).toHaveCount(0);
  await expect(page.locator(".dino-illustration")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/falabrinca-assinatura-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "/tmp/falabrinca-assinatura-desktop.png" });
});
test("todas as rotas de conteúdo exigem autenticação, inclusive as antigas demonstrações", async ({
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
test("sem configuração, biblioteca e painel não revelam cards nem permitem edição", async ({
  page,
}) => {
  await page.goto("/atividades");
  await expect(page.getByRole("status")).toContainText("configurado");
  await expect(page.locator(".adventure-card")).toHaveCount(0);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Acesso master necessário" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nova atividade" }),
  ).toHaveCount(0);
});
test("webhook rejeita assinatura inválida e solicita reenvio sem persistência", async ({
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
test("cache offline guarda somente apresentação pública e nunca biblioteca, master ou conta", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  for (const path of ["/conta", "/admin", "/atividades"]) await page.goto(path);
  await page.goto("/");
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
  for (const path of ["/conta", "/admin", "/atividades"])
    expect(paths).not.toContain(path);
  expect(paths.some((p) => p.startsWith("/api/"))).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".hero-price")).toContainText("R$ 50,00");
  await expect(page.locator(".adventure-card")).toHaveCount(0);
});
