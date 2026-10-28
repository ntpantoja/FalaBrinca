import { test, expect } from "@playwright/test";
import Stripe from "stripe";
test("identificação: erro permite tentativa, três acertos rendem estrelas persistidas", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Começar a brincar" }).click();
  await page.getByRole("button", { name: "BOLA", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("tentar de novo");
  for (const word of ["MAÇÃ", "GATO", "BOLA"]) {
    await page.getByRole("button", { name: word, exact: true }).click();
    await page
      .getByRole("button", {
        name: word === "BOLA" ? "Ganhar minhas estrelas" : "Próxima descoberta",
      })
      .click();
  }
  await expect(page.locator(".reward")).toContainText("3 estrelas");
  await page.reload();
  await expect(page.locator(".star-count")).toContainText("3 estrelas");
});
test("associação: três situações e recompensa", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Palavras que combinam/ }).click();
  for (const word of ["COMIDA", "GUARDA-CHUVA", "ESCOVA"]) {
    await page.getByRole("button", { name: word, exact: true }).click();
    await page
      .getByRole("button", {
        name:
          word === "ESCOVA" ? "Ganhar minhas estrelas" : "Próxima descoberta",
      })
      .click();
  }
  await expect(page.locator(".reward")).toContainText("3 estrelas");
});
test("frases: ordem incorreta não avança e três frases podem ser montadas", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Minha primeira frase/ }).click();
  await page.getByRole("button", { name: "MAÇÃ", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("por partes");
  for (const [index, words] of [
    ["DINO", "COME", "MAÇÃ"],
    ["GATO", "QUER", "BOLA"],
    ["DINO", "BEBE", "ÁGUA"],
  ].entries()) {
    for (const word of words)
      await page.getByRole("button", { name: word, exact: true }).click();
    await page
      .getByRole("button", {
        name: index === 2 ? "Ganhar minhas estrelas" : "Próxima descoberta",
      })
      .click();
  }
  await expect(page.locator(".reward")).toContainText("3 estrelas");
});
test("área dos adultos mostra plano, ausência de configuração e não permite cobrar", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Área dos adultos" }).click();
  await page.getByLabel("Resposta").fill("12");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("link", { name: "Criar conta ou entrar" }).click();
  await expect(page.getByText("Cadastro em preparação")).toBeVisible();
  await expect(page.locator(".price")).toContainText("R$ 50,00");
  await expect(
    page.getByRole("button", { name: "Entre ou crie sua conta para assinar" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("APIs não entregam dados ou checkout sem autenticação", async ({
  request,
}) => {
  for (const path of ["/api/account", "/api/activities/premium"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
  }
  const checkout = await request.post("/api/checkout", {
    headers: { Origin: "http://localhost:3100" },
  });
  expect(checkout.status()).toBe(401);
  const wrongOrigin = await request.post("/api/checkout", {
    headers: { Origin: "https://outro.example" },
  });
  expect(wrongOrigin.status()).toBe(403);
  const portal = await request.post("/api/portal", {
    headers: { Origin: "http://localhost:3100" },
  });
  expect(portal.status()).toBe(401);
});
test("webhook valida assinatura e pede reenvio se não conseguir persistir", async ({
  request,
}) => {
  const stripe = new Stripe("sk_test_local_fixture");
  const invalid = await request.post("/api/webhooks/stripe", { data: "{}" });
  expect(invalid.status()).toBe(400);
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
  const valid = await request.post("/api/webhooks/stripe", {
    data: payload,
    headers: {
      "stripe-signature": signature,
      "Content-Type": "application/json",
    },
  });
  expect(valid.status()).toBe(503);
});
test("PWA mantém atividade gratuita offline e não guarda páginas da conta", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.goto("/conta");
  await page.goto("/");
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    return (
      await Promise.all(
        keys.map(async (key) =>
          (await (await caches.open(key)).keys()).map(
            (request) => new URL(request.url).pathname,
          ),
        ),
      )
    ).flat();
  });
  expect(cached).not.toContain("/conta");
  expect(cached.some((path) => path.startsWith("/api/"))).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Começar a brincar" }).click();
  await page.getByRole("button", { name: "MAÇÃ", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Isso!");
});
