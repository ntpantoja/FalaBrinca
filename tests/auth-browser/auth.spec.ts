import { test, expect } from "@playwright/test";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "adulto@example.com",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
};
const jwt = [
  { alg: "HS256", typ: "JWT" },
  {
    sub: user.id,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  { fixture: true },
]
  .map((part) => Buffer.from(JSON.stringify(part)).toString("base64url"))
  .join(".");
test("cadastro com confirmação, login, botão de assinatura e saída — provedores simulados", async ({
  page,
}) => {
  await page.route("https://auth.falabrinca.test/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/signup"))
      return route.fulfill({ json: { user, session: null } });
    if (url.pathname.endsWith("/token"))
      return route.fulfill({
        json: {
          access_token: jwt,
          refresh_token: "refresh-local-test",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: "bearer",
          user,
        },
      });
    if (url.pathname.endsWith("/user")) return route.fulfill({ json: user });
    return route.fulfill({ status: 204 });
  });
  await page.route("**/api/account", (route) =>
    route.fulfill({
      json: { active: false, status: "none", canManage: false },
    }),
  );
  await page.route("**/api/checkout", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Pagamento de teste indisponível." },
    }),
  );
  await page.goto("/conta");
  await page.getByLabel("E-mail do responsável").fill(user.email);
  await page.getByLabel("Senha", { exact: false }).fill("SenhaTeste123!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await expect(page.getByRole("status")).toContainText("confirme o cadastro");
  await page.getByRole("button", { name: "Já tenho conta" }).click();
  await page.getByLabel("Senha", { exact: true }).fill("SenhaTeste123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator(".account-email")).toHaveText(user.email);
  await expect(page.locator(".status-badge")).toHaveText("Sem assinatura");
  await page.getByRole("button", { name: "Assinar por R$ 50,00/mês" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Pagamento de teste indisponível",
  );
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page.getByLabel("E-mail do responsável")).toBeVisible();
});
test("recuperação de senha envia pedido sem revelar existência da conta — provedor simulado", async ({
  page,
}) => {
  await page.route("https://auth.falabrinca.test/auth/v1/recover**", (route) =>
    route.fulfill({ json: {} }),
  );
  await page.goto("/conta");
  await page.getByRole("button", { name: "Já tenho conta" }).click();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail do responsável").fill(user.email);
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se houver uma conta");
});
