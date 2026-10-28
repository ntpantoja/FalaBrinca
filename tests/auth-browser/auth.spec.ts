import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { catalog, type ActivityContent } from "../../lib/catalog";
import { sequencePictures } from "../../lib/pictures";
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
  .map((p) => Buffer.from(JSON.stringify(p)).toString("base64url"))
  .join(".");
const session = {
  access_token: jwt,
  refresh_token: "refresh-local-test",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user,
};
async function authMock(page: Page) {
  await page.route("https://auth.falabrinca.test/auth/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/signup"))
      return route.fulfill({ json: { user, session: null } });
    if (path.endsWith("/token")) return route.fulfill({ json: session });
    if (path.endsWith("/user")) return route.fulfill({ json: user });
    return route.fulfill({ json: {} });
  });
  await page.route("**/api/account", (r) =>
    r.fulfill({ json: { active: false, status: "none", canManage: false } }),
  );
}
async function loginCallback(page: Page) {
  await page.goto(
    `/auth/continuar#access_token=${jwt}&refresh_token=refresh-local-test&expires_in=3600&token_type=bearer&type=signup`,
  );
  await page.waitForURL("**/conta?completar=1");
}
test("e-mail confirmado leva ao perfil, sem novo login; nomes, pagamento e saída — serviços simulados", async ({
  page,
}) => {
  await authMock(page);
  let profile: unknown = null;
  await page.route("**/api/profile", async (route) => {
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();
      expect(body.consent).toBe(true);
      profile = {
        guardian_name: body.guardian_name,
        child_first_name: body.child_first_name,
        consent_version: "2026-10-28",
      };
    }
    return route.fulfill({ json: { profile } });
  });
  await page.route("**/api/checkout", (r) =>
    r.fulfill({
      status: 503,
      json: { error: "Pagamento de teste indisponível." },
    }),
  );
  await page.goto("/conta");
  await page.screenshot({
    path: "/tmp/falabrinca-novo-cadastro.png",
    fullPage: true,
  });
  await page.getByLabel("E-mail do responsável").fill(user.email);
  await page.getByLabel(/^Senha/).fill("SenhaTeste123!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await expect(
    page.getByRole("heading", { name: /Um convite chegou/ }),
  ).toBeVisible();
  await expect(page.locator(".email-check")).toContainText(
    "primeiro nome da criança",
  );
  await loginCallback(page);
  await expect(
    page.getByLabel("Nome do responsável", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("E-mail do responsável")).toHaveCount(0);
  await page
    .getByLabel("Nome do responsável", { exact: true })
    .fill("Ana Maria");
  await page
    .getByLabel("Primeiro nome da criança", { exact: false })
    .fill("Bia");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Salvar e começar a explorar" })
    .click();
  await expect(
    page.getByRole("heading", { name: "O cantinho de Bia" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Assinar por R$ 50,00/mês" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Pagamento de teste indisponível",
  );
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page.getByLabel("E-mail do responsável")).toBeVisible();
});
test("Google encaminha ao provedor com retorno para o cadastro — autorização não é simulada como login real", async ({
  page,
}) => {
  await authMock(page);
  await page.route("https://auth.falabrinca.test/auth/v1/authorize**", (r) =>
    r.fulfill({ contentType: "text/html", body: "<p>Provedor simulado</p>" }),
  );
  await page.goto("/conta");
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await page.waitForURL("**/auth/v1/authorize?**");
  const url = new URL(page.url());
  expect(url.searchParams.get("provider")).toBe("google");
  expect(url.searchParams.get("redirect_to")).toBe(
    "http://localhost:3101/auth/continuar",
  );
});
test("recuperação mantém mensagem sem revelar se conta existe", async ({
  page,
}) => {
  await authMock(page);
  await page.goto("/conta");
  await page
    .getByRole("button", { name: "Já tenho conta", exact: true })
    .click();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail do responsável").fill(user.email);
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se houver uma conta");
});
// Conteúdo real do servidor, entregue por um transporte simulado somente nos testes de UI.
const content: Record<string, ActivityContent> = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "-e",
      "import('./lib/activity-content.ts').then(m=>process.stdout.write(JSON.stringify(m.allContent)))",
    ],
    { encoding: "utf8" },
  ),
);
for (const activity of catalog)
  test(`atividade visual completa: ${activity.title}`, async ({ page }) => {
    await authMock(page);
    await page.addInitScript(
      (value) =>
        localStorage.setItem("sb-auth-auth-token", JSON.stringify(value)),
      session,
    );
    await page.route("**/api/profile", (r) =>
      r.fulfill({ json: { profile: null } }),
    );
    await page.route(`**/api/activities/${activity.id}`, (r) =>
      r.fulfill({ json: content[activity.id] }),
    );
    await page.goto(`/?atividade=${activity.id}`);
    await page.locator(".picture-options").waitFor();
    for (const [index, round] of content[activity.id].rounds.entries()) {
      const answers = round.words
        ? sequencePictures(round.words).map((piece) => piece.name.split(":")[1])
        : [round.answer];
      for (const name of answers)
        await page.getByRole("button", { name, exact: true }).click();
      await page
        .getByRole("button", {
          name: index === 2 ? "Ganhar minhas estrelas" : "Próxima descoberta",
        })
        .click();
    }
    await expect(page.locator(".reward-stars")).toContainText("+3");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
