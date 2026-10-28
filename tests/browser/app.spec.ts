import { test, expect } from "@playwright/test";
import Stripe from "stripe";
async function finish(
  page: import("@playwright/test").Page,
  answers: string[][],
) {
  for (const [i, words] of answers.entries()) {
    for (const name of words)
      await page.getByRole("button", { name, exact: true }).click();
    await page
      .getByRole("button", {
        name:
          i === answers.length - 1
            ? "Ganhar minhas estrelas"
            : "Próxima descoberta",
      })
      .click();
  }
}
test("figuras: jogo sem texto nas respostas, tentativas, recompensa e persistência", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".adventure-card")).toHaveCount(24);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/falabrinca-novo-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "/tmp/falabrinca-novo-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Começar a brincar" }).click();
  await page.getByRole("button", { name: "BOLA", exact: true }).click();
  await expect(page.locator(".picture-feedback")).toContainText(
    "tentar de novo",
  );
  await expect(page.locator(".picture-options button").first()).toHaveText(
    "⚽",
  );
  await finish(page, [["MAÇÃ"], ["GATO"], ["BOLA"]]);
  await expect(page.locator(".reward-stars")).toContainText("+3");
  await page.reload();
  await expect(page.locator(".star-count")).toContainText("3");
});
test("associações: três situações ilustradas", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Jogar Palavras que combinam", exact: true })
    .click();
  await finish(page, [["COMIDA"], ["GUARDA-CHUVA"], ["ESCOVA"]]);
  await expect(page.locator(".reward-stars")).toContainText("+3");
});
test("histórias: peças são figuras, erro permite outra escolha e três histórias completam", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Jogar Minha primeira frase", exact: true })
    .click();
  await page.getByRole("button", { name: "MAÇÃ", exact: true }).click();
  await expect(page.locator(".picture-feedback")).toContainText("tentar");
  await expect(page.locator(".picture-options button").first()).toHaveText(
    "😋",
  );
  await finish(page, [
    ["DINO", "COME", "MAÇÃ"],
    ["GATO", "QUER", "BOLA"],
    ["DINO", "BEBE", "ÁGUA"],
  ]);
  await expect(page.locator(".reward-stars")).toContainText("+3");
});
test("favoritos, filtros por ícone, pausa e jardim funcionam no celular", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", {
      name: "Adicionar aos favoritos: Que figura é essa?",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Favoritas", exact: true }).click();
  await expect(page.locator(".adventure-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Favoritas", exact: true }).click();
  await expect(page.locator(".adventure-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Jogar Que figura é essa?", exact: true })
    .click();
  await page.getByRole("button", { name: "Fazer uma pausa" }).click();
  await expect(
    page.getByRole("dialog", { name: "Pausa na brincadeira" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar a aventura" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("área adulta conserva preço e não cobra sem configuração", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Área dos adultos", exact: true })
    .click();
  await page.getByLabel("Resposta").fill("12");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("link", { name: "Criar conta ou entrar" }).click();
  await expect(page.getByText("Cadastro em preparação")).toBeVisible();
  await expect(page.locator(".price")).toContainText("R$ 50,00");
  await expect(
    page.getByRole("button", { name: "Entre ou crie sua conta para assinar" }),
  ).toBeDisabled();
});
test("APIs de perfil e atividades pagas exigem autenticação e bloqueiam origem externa", async ({
  request,
}) => {
  for (const path of [
    "/api/account",
    "/api/profile",
    "/api/activities/premium",
    "/api/activities/frutas",
  ])
    expect((await request.get(path)).status()).toBe(401);
  expect((await request.get("/api/activities/nao-existe")).status()).toBe(404);
  expect(
    (
      await request.post("/api/checkout", {
        headers: { Origin: "http://localhost:3100" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/checkout", {
        headers: { Origin: "https://outro.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.put("/api/profile", {
        headers: { Origin: "http://localhost:3100" },
        data: { guardian_name: "Ana", child_first_name: "Bia", consent: true },
      })
    ).status(),
  ).toBe(401);
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
test("PWA conserva jogos gratuitos offline e exclui conta e callback do cache", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.goto("/conta");
  await page.goto("/auth/continuar");
  await page.goto("/");
  const cached = await page.evaluate(async () => {
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
  expect(cached).not.toContain("/conta");
  expect(cached).not.toContain("/auth/continuar");
  expect(cached.some((p) => p.startsWith("/api/"))).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Começar a brincar" }).click();
  await page.getByRole("button", { name: "MAÇÃ", exact: true }).click();
  await expect(page.locator(".picture-feedback")).toContainText("Isso");
});
